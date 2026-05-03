import React, { useState, useMemo } from 'react';

const NODES = [
  { id: 'root', tier: 0, label: 'the question', sigil: '◇', layer: 'Meta-Core', color: '#A78BFA', text: 'why does compounding turn small gains into exponential research output', parent: null },
  { id: 't1', tier: 1, label: 'the mechanism', sigil: '✦', layer: 'Synthesis', color: '#22D3EE', text: "Each cycle's output becomes the next cycle's input. A 1% daily improvement is 37x over a year.", parent: 'root' },
  { id: 't2', tier: 1, label: 'why it feels slow', sigil: '✦', layer: 'Synthesis', color: '#22D3EE', text: 'Early gains look trivial. The curve stays flat for months before the exponential kicks in.', parent: 'root' },
  { id: 't3', tier: 1, label: 'what breaks it', sigil: '⊕', layer: 'Discriminator', color: '#F87171', text: 'Interruptions reset the base. Compounding requires unbroken cycles.', parent: 'root' },
  { id: 'b11', tier: 2, label: 'feedback loops', sigil: '△', layer: 'Encoder', color: '#818CF8', text: 'Each insight enables the next question. Tools built today speed tomorrow research.', parent: 't1' },
  { id: 'b12', tier: 2, label: 'the 1% math', sigil: '△', layer: 'Encoder', color: '#818CF8', text: '1.01^365 = 37.78. 0.99^365 = 0.026. Gap is ~1400x/year.', parent: 't1' },
  { id: 'b21', tier: 2, label: 'the flat zone', sigil: '△', layer: 'Encoder', color: '#818CF8', text: 'For 3 to 6 months, compounding looks linear. Most quit here.', parent: 't2' },
  { id: 'b31', tier: 2, label: 'context resets', sigil: '⊕', layer: 'Discriminator', color: '#F87171', text: 'Switching fields, losing notes — each reset restarts the counter.', parent: 't3' },
  { id: 'l1', tier: 3, label: 'github', sigil: '⊘', layer: 'Embedding', color: '#FBBF24', text: 'Daily-commit repos outperform weekly ones 30x over 2 years.', parent: 'b11' },
  { id: 'l2', tier: 3, label: 'feynman', sigil: '⊘', layer: 'Embedding', color: '#FBBF24', text: 'Feynman notebooks: 24 volumes, 40 years, all cross-referenced.', parent: 'b12' },
  { id: 'l3', tier: 3, label: 'darwin', sigil: '⊘', layer: 'Embedding', color: '#FBBF24', text: 'Darwin spent 23 years compounding before Origin.', parent: 'b21' },
  { id: 'l4', tier: 3, label: 'kahneman', sigil: '⊘', layer: 'Embedding', color: '#FBBF24', text: 'Switching tasks cost me 3 years of cognitive psychology.', parent: 'b31' },
];

const PATHS = {};
NODES.forEach(n => { PATHS[n.id] = n.parent ? [...PATHS[n.parent], n.id] : [n.id]; });

function sefirotPos(n, allNodes) {
  if (n.tier === 0) return { x: 500, y: 55 };
  const tierY = { 1: 195, 2: 355, 3: 510 };
  if (n.tier === 1) {
    const tier1 = allNodes.filter(x => x.tier === 1);
    const idx = tier1.indexOf(n);
    return { x: [180, 500, 820][idx], y: tierY[1] };
  }
  const siblings = allNodes.filter(x => x.parent === n.parent);
  const idx = siblings.indexOf(n);
  const total = siblings.length;
  const parent = allNodes.find(x => x.id === n.parent);
  const pp = sefirotPos(parent, allNodes);
  if (total === 1) return { x: pp.x, y: tierY[n.tier] };
  const spread = (total - 1) * 160;
  return { x: pp.x - spread / 2 + idx * (spread / (total - 1)), y: tierY[n.tier] };
}

function radialPos(n, allNodes) {
  const cx = 500, cy = 290;
  if (n.tier === 0) return { x: cx, y: cy };
  const siblings = allNodes.filter(x => x.tier === n.tier);
  const idx = siblings.indexOf(n);
  const total = siblings.length;
  const radii = { 1: 130, 2: 225, 3: 320 };
  const angle = -Math.PI / 2 + (idx / total) * Math.PI * 2;
  return { x: cx + Math.cos(angle) * radii[n.tier], y: cy + Math.sin(angle) * radii[n.tier] };
}

function horizontalPos(n, allNodes) {
  const cols = { 0: 90, 1: 340, 2: 640, 3: 920 };
  if (n.tier === 0) return { x: cols[0], y: 290 };
  const siblings = allNodes.filter(x => x.tier === n.tier);
  const idx = siblings.indexOf(n);
  const total = siblings.length;
  const spacing = 480 / Math.max(total, 1);
  return { x: cols[n.tier], y: 50 + (idx + 0.5) * spacing };
}

