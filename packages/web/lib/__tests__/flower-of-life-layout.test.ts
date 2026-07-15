import { describe, it, expect } from 'vitest';
import {
  flowerOfLifeLayout,
  flowerLayoutRadius,
  flowerOfLifeCircles,
} from '../flower-of-life-layout';

const CENTER = { x: 500, y: 400 };
const SPACING = 100;

/** Synthetic cluster: node-0 most important, importance strictly decreasing. */
function makeNodes(n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: `node-${i}`, importance: n - i }));
}
const imp = (n: { importance: number }) => n.importance;

describe('flowerOfLifeLayout', () => {
  it('places the highest-importance node at the exact center', () => {
    const nodes = makeNodes(30);
    const pos = flowerOfLifeLayout(nodes, imp, CENTER, SPACING);
    expect(pos.get('node-0')).toEqual(CENTER);
  });

  it('is deterministic — same input, same layout (incl. importance ties)', () => {
    const nodes = makeNodes(50).map((n, i) => ({ ...n, importance: i % 5 }));
    const a = flowerOfLifeLayout(nodes, imp, CENTER, SPACING);
    const b = flowerOfLifeLayout([...nodes].reverse(), imp, CENTER, SPACING);
    for (const [id, p] of a) expect(b.get(id)).toEqual(p);
  });

  it('radius grows monotonically as pertinence decreases (center → outward)', () => {
    const nodes = makeNodes(124);
    const pos = flowerOfLifeLayout(nodes, imp, CENTER, SPACING);
    let prev = -1;
    for (let i = 0; i < nodes.length; i++) {
      const p = pos.get(`node-${i}`)!;
      const r = Math.hypot(p.x - CENTER.x, p.y - CENTER.y);
      expect(r).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = r;
    }
  });

  it('has no collisions on a dense 124-node cluster (Vogel packing ≥ ~0.8·spacing)', () => {
    const nodes = makeNodes(124);
    const pos = flowerOfLifeLayout(nodes, imp, CENTER, SPACING);
    const pts = [...pos.values()];
    let minDist = Infinity;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        minDist = Math.min(minDist, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
      }
    }
    // max dot radius in the drill view is 35 → diameter 70; spacing 100 must keep ≥ 80 apart
    expect(minDist).toBeGreaterThanOrEqual(SPACING * 0.8);
  });

  it('handles 1 node (center only) and 200+ nodes gracefully', () => {
    const one = flowerOfLifeLayout(makeNodes(1), imp, CENTER, SPACING);
    expect(one.size).toBe(1);
    expect(one.get('node-0')).toEqual(CENTER);
    expect(flowerLayoutRadius(1, SPACING)).toBe(0);

    const many = flowerOfLifeLayout(makeNodes(220), imp, CENTER, SPACING);
    expect(many.size).toBe(220);
    const maxR = flowerLayoutRadius(220, SPACING);
    for (const p of many.values()) {
      expect(Math.hypot(p.x - CENTER.x, p.y - CENTER.y)).toBeLessThanOrEqual(maxR + 1e-9);
    }
  });
});

describe('flowerOfLifeCircles', () => {
  it('returns the canonical 19 petal circles + enclosing double circle', () => {
    const circles = flowerOfLifeCircles(CENTER, 100);
    expect(circles.length).toBe(21); // 1 + 6 + 6 + 6 petals, + 2 enclosing
    expect(circles.filter((c) => c.r === 100).length).toBe(19);
    // enclosing circle at 3R
    expect(circles.some((c) => c.r === 300 && c.cx === CENTER.x && c.cy === CENTER.y)).toBe(true);
  });
});
