// M4a proof harness — measures PURE SQL compute time and prints the FULL candidate ordering.
// Replicates lib/mindmap-ranking.ts's exact SQL + scoring with better-sqlite3 directly (the lib
// imports 'server-only', which throws under tsx). The SHIPPED lib is proven end-to-end via the API;
// this harness exists only to (a) time the raw DB compute and (b) show the full ranking so a
// bridge-beats-degree case is visible. Weights are copied verbatim from RICHNESS_WEIGHTS.
// Usage: from packages/web:  node scripts/rank-eval.mjs
import Database from 'better-sqlite3';

const db = new Database('data/akhai.db', { readonly: true });
const USER = process.env.RANK_USER || '23nb8w2ytj9';
const HUBS = (process.env.RANK_HUBS || '8090e19793bdd36d,5434c8a5cef488f8,7e9c35163ae16b2f').split(
  ','
);
const W = { bridgeCentrality: 0.5, substance: 0.1, connectivity: 0.1, crossSubject: 0.3 };
const K = 3200;
const activeSum = W.bridgeCentrality + W.substance + W.connectivity + W.crossSubject;
const minMax = (v, mn, mx) => (mx <= mn ? (mx === 0 ? 0 : 0.5) : (v - mn) / (mx - mn));

const qNeighbors = db.prepare(
  `SELECT DISTINCT t.id AS id, t.name AS name, COALESCE(t.category,'other') AS category
     FROM topic_relationships r
     JOIN topics t ON t.id = CASE WHEN r.topic_from=@tid THEN r.topic_to ELSE r.topic_from END AND t.user_id=@uid
    WHERE (r.topic_from=@tid OR r.topic_to=@tid) AND r.user_id=@uid AND t.id!=@tid`
);

function rank(topicId, userId, limit = 999) {
  const neighbors = qNeighbors.all({ tid: topicId, uid: userId });
  if (!neighbors.length) return [];
  const ids = neighbors.map((n) => n.id);
  const ph = ids.map(() => '?').join(',');
  const edges = db
    .prepare(
      `SELECT r.topic_from AS a, r.topic_to AS b, r.strength AS strength,
              COALESCE(tf.category,'other') AS catFrom, COALESCE(tt.category,'other') AS catTo
         FROM topic_relationships r
         LEFT JOIN topics tf ON tf.id=r.topic_from LEFT JOIN topics tt ON tt.id=r.topic_to
        WHERE r.user_id=? AND (r.topic_from IN (${ph}) OR r.topic_to IN (${ph}))`
    )
    .all(userId, ...ids, ...ids);
  const substance = db
    .prepare(
      `SELECT qt.topic_id AS topic_id, SUM(qt.relevance) AS relevanceSum,
              COALESCE(SUM(CASE WHEN q.status='complete' THEN q.tokens_used ELSE 0 END),0) AS discussionTokens
         FROM query_topics qt LEFT JOIN queries q ON q.id=qt.query_id
        WHERE qt.topic_id IN (${ph}) GROUP BY qt.topic_id`
    )
    .all(...ids);

  const cand = new Map(
    neighbors.map((n) => [n.id, { own: n.category, wDeg: 0, cats: new Set() }])
  );
  const set = new Set(ids);
  for (const e of edges) {
    const s = e.strength ?? 0;
    if (set.has(e.a)) { const c = cand.get(e.a); c.wDeg += s; c.cats.add(e.catTo); }
    if (set.has(e.b)) { const c = cand.get(e.b); c.wDeg += s; c.cats.add(e.catFrom); }
  }
  const subById = new Map(substance.map((s) => [s.topic_id, s]));
  const raws = neighbors.map((n) => {
    const st = cand.get(n.id);
    const sub = subById.get(n.id);
    const rel = sub?.relevanceSum ?? 0, tok = sub?.discussionTokens ?? 0;
    const foreign = [...st.cats].filter((c) => c !== st.own).length;
    const substanceRaw = rel * (1 + tok / (tok + K));
    return {
      node: n,
      sig: { bridgeCentrality: foreign, substance: substanceRaw, connectivity: st.wDeg, crossSubject: st.cats.size },
      raw: { foreign, total: st.cats.size, wDeg: st.wDeg, rel, tok },
    };
  });
  const b = {};
  for (const k of Object.keys(W)) { const v = raws.map((r) => r.sig[k]); b[k] = { mn: Math.min(...v), mx: Math.max(...v) }; }
  const out = raws.map((r) => {
    const norm = {};
    for (const k of Object.keys(W)) norm[k] = minMax(r.sig[k], b[k].mn, b[k].mx);
    const score = Object.keys(W).reduce((s, k) => s + norm[k] * W[k], 0) / activeSum;
    return { ...r.node, score, norm, raw: r.raw };
  });
  out.sort((x, y) => y.score - x.score || y.raw.wDeg - x.raw.wDeg);
  return out.slice(0, limit);
}

for (const hub of HUBS) {
  const t0 = process.hrtime.bigint();
  const all = rank(hub, USER);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  const hubName = db.prepare('SELECT name FROM topics WHERE id=?').get(hub)?.name || hub;
  console.error(`\n${'='.repeat(80)}\nHUB ${hubName} (${hub}) — ${all.length} neighbors, compute ${ms.toFixed(2)}ms`);
  all.slice(0, 8).forEach((r, i) => {
    const tag = i < 3 ? `#${i + 1}` : '  ';
    console.error(
      `  ${tag} ${r.name.padEnd(34).slice(0, 34)} [${(r.category || '').padEnd(10).slice(0, 10)}] ` +
        `score=${r.score.toFixed(3)}  bridge=${r.norm.bridgeCentrality.toFixed(2)} sub=${r.norm.substance.toFixed(2)} ` +
        `conn=${r.norm.connectivity.toFixed(2)} cross=${r.norm.crossSubject.toFixed(2)}  ` +
        `| foreignCats=${r.raw.foreign} wDeg=${r.raw.wDeg.toFixed(1)}`
    );
  });
}
db.close();
