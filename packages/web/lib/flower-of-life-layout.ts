/**
 * mindmap-flower — pertinence-ranked Flower-of-Life layout for the cluster-detail (drill) view.
 *
 * HYBRID approach (Algoq's default): the sacred Flower-of-Life geometry is drawn as a faint
 * backdrop (flowerOfLifeCircles), while the nodes themselves are placed on a pertinence-ranked
 * golden-angle (Vogel) spiral scaled to the flower's proportions — the most-pertinent topic sits
 * at the exact center and pertinence decreases monotonically outward, with zero collisions even
 * on dense (124+) clusters where rigid hex vertices would stack labels.
 *
 * Deterministic: same input → same layout (stable sort, zero randomness — required for lib/).
 * Handles any node count from 1 to 200+.
 */

export interface FlowerPoint {
  x: number;
  y: number;
}

/** Golden angle ≈ 137.507°, the irrational rotation that keeps spiral points from aligning. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Rank nodes by importance DESC (ties broken by id for determinism) and place them:
 * rank 0 → exact center; rank i → radius spacing·√i at angle i·GOLDEN_ANGLE, starting at the
 * top (12 o'clock) and winding clockwise. Vogel packing keeps every pair ≥ ~0.9·spacing apart,
 * so pick `spacing` larger than the biggest dot diameter to guarantee no overlap.
 */
export function flowerOfLifeLayout<T extends { id: string }>(
  nodes: T[],
  importanceOf: (node: T) => number,
  center: FlowerPoint,
  spacing: number
): Map<string, FlowerPoint> {
  const ranked = [...nodes].sort(
    (a, b) => importanceOf(b) - importanceOf(a) || a.id.localeCompare(b.id)
  );
  const out = new Map<string, FlowerPoint>();
  ranked.forEach((node, i) => {
    if (i === 0) {
      out.set(node.id, { x: center.x, y: center.y });
      return;
    }
    const radius = spacing * Math.sqrt(i);
    // -PI/2 starts at the top vertex; +angle winds clockwise in SVG's y-down space.
    const angle = -Math.PI / 2 + i * GOLDEN_ANGLE;
    out.set(node.id, {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  });
  return out;
}

/** Outermost spiral radius for n nodes at the given spacing (0 for a single node). */
export function flowerLayoutRadius(nodeCount: number, spacing: number): number {
  return nodeCount <= 1 ? 0 : spacing * Math.sqrt(nodeCount - 1);
}

export interface FlowerCircle {
  cx: number;
  cy: number;
  r: number;
}

/**
 * The canonical 19-circle Flower of Life (unit circle radius R): one at the center, six with
 * centers on the first hex ring (distance R), six on the outer hex vertices (distance 2R) and
 * six on the edge midpoints (distance √3·R, offset 30°), plus the traditional enclosing
 * double circle at 3R. All petal circles share radius R; vertices start at the top (12 o'clock).
 */
export function flowerOfLifeCircles(center: FlowerPoint, R: number): FlowerCircle[] {
  const circles: FlowerCircle[] = [{ cx: center.x, cy: center.y, r: R }];
  const vertex = (dist: number, offsetDeg: number, k: number): FlowerPoint => {
    const angle = -Math.PI / 2 + (offsetDeg * Math.PI) / 180 + (k * Math.PI) / 3;
    return { x: center.x + Math.cos(angle) * dist, y: center.y + Math.sin(angle) * dist };
  };
  for (let k = 0; k < 6; k++) {
    const p1 = vertex(R, 0, k);
    circles.push({ cx: p1.x, cy: p1.y, r: R });
  }
  for (let k = 0; k < 6; k++) {
    const p2 = vertex(2 * R, 0, k);
    circles.push({ cx: p2.x, cy: p2.y, r: R });
  }
  for (let k = 0; k < 6; k++) {
    const pm = vertex(Math.sqrt(3) * R, 30, k);
    circles.push({ cx: pm.x, cy: pm.y, r: R });
  }
  circles.push({ cx: center.x, cy: center.y, r: 3 * R });
  circles.push({ cx: center.x, cy: center.y, r: 3 * R + R * 0.08 });
  return circles;
}
