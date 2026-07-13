import 'server-only';

/**
 * M4a mindmap-rank — $0 hover ranking.
 *
 * On hover we surface the TOP-3 richest/most-resourceful DIRECT neighbors of a topic, ranked by
 * four pure graph/substance signals computed entirely in SQL over the user's own data. NO provider
 * calls, no LLM, instant. The expensive Opus "transformative potential" judgment (weight 0.10) is
 * RESERVED for the click-to-deepen path (rank/deepen) and the daily curator pass (M4c) — it NEVER
 * fires here. On hover we re-normalize the 4 active weights to sum-to-1 (the 0.10 is absent).
 *
 * Everything is scoped by user_id (LOCK discipline — a user ranks only their own graph).
 */

import { db } from '@/lib/database';

/**
 * Tunable ranking surface. Weights are the ONLY knobs Algoq should need to touch — the signals
 * they multiply are documented inline. transformative is listed for completeness but is NOT part
 * of the hover blend (see re-normalization in scoreCandidates).
 */
export const RICHNESS_WEIGHTS = {
  // Does this neighbor connect otherwise-distant CATEGORIES? Counts how many categories DIFFERENT
  // from the neighbor's own its neighbors span — i.e. FOREIGN subjects bridged (2 hops from the
  // hovered topic). A high-degree node whose neighbors are all one category bridges nothing.
  bridgeCentrality: 0.3,
  // Backed by real, deep discussions: sum of query_topics.relevance for the neighbor, bumped by the
  // token-depth of the complete queries behind it. A topic with many deep discussions is rich.
  substance: 0.25,
  // Weighted degree = SUM(strength) over the neighbor's edges. Raw graph pull.
  connectivity: 0.2,
  // Breadth of subject exposure: total distinct categories among the neighbor's direct neighbors
  // (includes its own category, unlike bridgeCentrality which counts only foreign ones).
  crossSubject: 0.15,
  // RESERVED — transformative potential. Requires an Opus judgment; computed on click-to-deepen /
  // the M4c curator pass, never on hover. Kept here so the tuning surface is complete.
  transformative: 0.1,
} as const;

// Only these four are active on hover; their weights are re-normalized to sum to 1.
const HOVER_SIGNALS = ['bridgeCentrality', 'substance', 'connectivity', 'crossSubject'] as const;
type HoverSignal = (typeof HOVER_SIGNALS)[number];

// A complete query with real depth. Matches queries.status values in the DB ('complete').
const COMPLETE_STATUS = 'complete';
// Saturating constant for the token-depth bump: substance = relevanceSum * (1 + tokens/(tokens+K)).
// K ≈ the corpus average tokens/complete-query (~3200), so a topic backed by average-depth
// discussions gets ~1.5×, a very deep one approaches 2×, an empty one stays at 1×.
const DEPTH_SATURATION_K = 3200;

export interface TopicRank {
  topicId: string;
  name: string;
  category: string;
  score: number; // 0-1, weighted blend of the 4 hover signals (re-normalized weights)
  signals: {
    bridge: number; // 0-1 normalized
    substance: number; // 0-1 normalized
    connectivity: number; // 0-1 normalized
    crossSubject: number; // 0-1 normalized
  };
  // Raw (pre-normalization) values — surfaced so Algoq can see WHY each ranked where it did.
  raw: {
    foreignCategories: number; // distinct foreign categories bridged
    totalCategories: number; // distinct categories among its neighbors
    weightedDegree: number; // SUM(strength)
    relevanceSum: number; // SUM(query_topics.relevance)
    discussionTokens: number; // SUM(tokens_used) of complete queries behind it
  };
}

interface NeighborRow {
  id: string;
  name: string;
  category: string;
}

interface EdgeRow {
  center: string; // the candidate neighbor
  other: string; // the endpoint on the other side
  strength: number;
  otherCategory: string | null;
}

interface SubstanceRow {
  topic_id: string;
  relevanceSum: number;
  discussionTokens: number;
}

/** min-max normalize a raw value across the candidate set → 0-1. Flat set (all equal) → all 0.5. */
function minMax(value: number, min: number, max: number): number {
  if (max <= min) return max === 0 ? 0 : 0.5;
  return (value - min) / (max - min);
}

/**
 * Rank the direct neighbors of `topicId` (both edge directions) for `userId`, returning the top-3
 * by the 4-signal richness blend. Bounded to the hovered topic's neighborhood — one seek for the
 * candidate set, one for their edges, one for their substance. No full-graph scan.
 */
export function rankConnectedTopics(topicId: string, userId: string, limit = 3): TopicRank[] {
  // 1. Direct neighbors of the hovered topic (both directions), as candidates. Bounded by degree.
  const neighbors = db
    .prepare(
      `SELECT DISTINCT t.id AS id, t.name AS name, COALESCE(t.category, 'other') AS category
         FROM topic_relationships r
         JOIN topics t
           ON t.id = CASE WHEN r.topic_from = @tid THEN r.topic_to ELSE r.topic_from END
          AND t.user_id = @uid
        WHERE (r.topic_from = @tid OR r.topic_to = @tid)
          AND r.user_id = @uid
          AND t.id != @tid`
    )
    .all({ tid: topicId, uid: userId }) as NeighborRow[];

  if (neighbors.length === 0) return [];

  const candidateIds = neighbors.map((n) => n.id);
  const byId = new Map(neighbors.map((n) => [n.id, n]));
  const placeholders = candidateIds.map(() => '?').join(',');

  // 2. Every edge of every candidate (both directions), with the OTHER endpoint's category.
  //    Powers connectivity (SUM strength), crossSubject (distinct categories) and bridgeCentrality
  //    (distinct FOREIGN categories). One indexed sweep over the candidates' neighborhoods.
  const edges = db
    .prepare(
      `SELECT r.topic_from AS a, r.topic_to AS b, r.strength AS strength,
              COALESCE(tf.category, 'other') AS catFrom, COALESCE(tt.category, 'other') AS catTo
         FROM topic_relationships r
         LEFT JOIN topics tf ON tf.id = r.topic_from
         LEFT JOIN topics tt ON tt.id = r.topic_to
        WHERE r.user_id = ?
          AND (r.topic_from IN (${placeholders}) OR r.topic_to IN (${placeholders}))`
    )
    .all(userId, ...candidateIds, ...candidateIds) as Array<{
    a: string;
    b: string;
    strength: number | null;
    catFrom: string;
    catTo: string;
  }>;

  // 3. Substance: relevance sum + token-depth of the complete discussions behind each candidate.
  const substanceRows = db
    .prepare(
      `SELECT qt.topic_id AS topic_id,
              SUM(qt.relevance) AS relevanceSum,
              COALESCE(SUM(CASE WHEN q.status = ? THEN q.tokens_used ELSE 0 END), 0) AS discussionTokens
         FROM query_topics qt
         LEFT JOIN queries q ON q.id = qt.query_id
        WHERE qt.topic_id IN (${placeholders})
        GROUP BY qt.topic_id`
    )
    .all(COMPLETE_STATUS, ...candidateIds) as SubstanceRow[];

  // --- fold edges per candidate ---
  const candState = new Map<
    string,
    { ownCategory: string; weightedDegree: number; neighborCats: Set<string> }
  >();
  for (const n of neighbors) {
    candState.set(n.id, { ownCategory: n.category, weightedDegree: 0, neighborCats: new Set() });
  }
  const candidateSet = new Set(candidateIds);
  for (const e of edges) {
    const strength = e.strength ?? 0;
    if (candidateSet.has(e.a)) {
      const st = candState.get(e.a)!;
      st.weightedDegree += strength;
      st.neighborCats.add(e.catTo);
    }
    if (candidateSet.has(e.b)) {
      const st = candState.get(e.b)!;
      st.weightedDegree += strength;
      st.neighborCats.add(e.catFrom);
    }
  }

  const substanceById = new Map(substanceRows.map((s) => [s.topic_id, s]));

  // --- raw signals per candidate ---
  const raws = neighbors.map((n) => {
    const st = candState.get(n.id)!;
    const sub = substanceById.get(n.id);
    const relevanceSum = sub?.relevanceSum ?? 0;
    const discussionTokens = sub?.discussionTokens ?? 0;
    const totalCategories = st.neighborCats.size;
    // Foreign = categories among its neighbors that differ from the candidate's OWN category.
    const foreignCategories = [...st.neighborCats].filter((c) => c !== st.ownCategory).length;
    // token-depth bump, saturating in [1,2)
    const depthBump = discussionTokens / (discussionTokens + DEPTH_SATURATION_K);
    const substanceRaw = relevanceSum * (1 + depthBump);
    return {
      node: n,
      rawSignals: {
        bridgeCentrality: foreignCategories,
        substance: substanceRaw,
        connectivity: st.weightedDegree,
        crossSubject: totalCategories,
      } as Record<HoverSignal, number>,
      raw: {
        foreignCategories,
        totalCategories,
        weightedDegree: st.weightedDegree,
        relevanceSum,
        discussionTokens,
      },
    };
  });

  // --- min-max normalize each signal across the candidate set ---
  const bounds = {} as Record<HoverSignal, { min: number; max: number }>;
  for (const sig of HOVER_SIGNALS) {
    const vals = raws.map((r) => r.rawSignals[sig]);
    bounds[sig] = { min: Math.min(...vals), max: Math.max(...vals) };
  }

  // --- re-normalize the 4 active weights to sum-to-1 (transformative's 0.10 is absent on hover) ---
  const activeWeightSum = HOVER_SIGNALS.reduce((s, sig) => s + RICHNESS_WEIGHTS[sig], 0);

  const ranked: TopicRank[] = raws.map((r) => {
    const norm = {} as Record<HoverSignal, number>;
    for (const sig of HOVER_SIGNALS) {
      norm[sig] = minMax(r.rawSignals[sig], bounds[sig].min, bounds[sig].max);
    }
    const score =
      HOVER_SIGNALS.reduce((s, sig) => s + norm[sig] * RICHNESS_WEIGHTS[sig], 0) / activeWeightSum;
    return {
      topicId: r.node.id,
      name: r.node.name,
      category: r.node.category,
      score,
      signals: {
        bridge: norm.bridgeCentrality,
        substance: norm.substance,
        connectivity: norm.connectivity,
        crossSubject: norm.crossSubject,
      },
      raw: r.raw,
    };
  });

  ranked.sort((a, b) => b.score - a.score || b.raw.weightedDegree - a.raw.weightedDegree);
  return ranked.slice(0, limit);
}
