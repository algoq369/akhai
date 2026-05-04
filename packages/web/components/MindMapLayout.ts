import type { Node } from './MindMap';
import type { ClusterData, LayoutNode, TopicLink } from './MindMapUtils';
import { GOLDEN_ANGLE } from './MindMapUtils';
import type { AnalyseData } from './MindMapAnalysePanel';

// Build connection counts per node
export function buildConnectionCounts(topicLinks: TopicLink[]): Record<string, number> {
  const counts: Record<string, number> = {};
  topicLinks.forEach((link) => {
    counts[link.source] = (counts[link.source] || 0) + 1;
    counts[link.target] = (counts[link.target] || 0) + 1;
  });
  return counts;
}

// Detect shared nodes: connected to 2+ different categories
export function buildSharedNodeInfo(
  filteredNodes: Node[],
  topicLinks: TopicLink[]
): Record<string, string[]> {
  const nodeCatMap: Record<string, string> = {};
  filteredNodes.forEach((n) => {
    nodeCatMap[n.id] = n.category || 'other';
  });

  const shared: Record<string, string[]> = {};
  filteredNodes.forEach((n) => {
    const connectedCats = new Set<string>();
    connectedCats.add(n.category || 'other');
    topicLinks.forEach((link) => {
      if (link.source === n.id && nodeCatMap[link.target])
        connectedCats.add(nodeCatMap[link.target]);
      if (link.target === n.id && nodeCatMap[link.source])
        connectedCats.add(nodeCatMap[link.source]);
    });
    if (connectedCats.size >= 3) {
      shared[n.id] = Array.from(connectedCats);
    }
  });
  return shared;
}

// CLUSPLOT layout — golden-angle ellipse clusters
export function computeClusplotLayout(
  filteredNodes: Node[],
  dims: { width: number; height: number },
  sharedNodeInfo: Record<string, string[]>,
  connectionCounts: Record<string, number>
): { clusters: ClusterData[]; layoutNodes: Record<string, LayoutNode> } {
  const cx = dims.width / 2;
  const cy = dims.height / 2;

  // Group by category
  const catGroups = new Map<string, Node[]>();
  filteredNodes.forEach((n) => {
    const cat = n.category || 'other';
    if (!catGroups.has(cat)) catGroups.set(cat, []);
    catGroups.get(cat)!.push(n);
  });

  // Sort categories by total query count
  const sortedCats = Array.from(catGroups.entries()).sort(([, a], [, b]) => {
    const sumA = a.reduce((s, n) => s + (n.queryCount || 0), 0);
    const sumB = b.reduce((s, n) => s + (n.queryCount || 0), 0);
    return sumB - sumA;
  });

  const catCount = sortedCats.length;
  if (catCount === 0) return { clusters: [], layoutNodes: {} as Record<string, LayoutNode> };

  // Position cluster centers using golden angle
  const clusterRadius = Math.min(dims.width, dims.height) * (catCount >= 4 ? 0.35 : 0.28);
  const clusterList: ClusterData[] = [];
  const nodeLayout: Record<string, LayoutNode> = {};

  sortedCats.forEach(([cat, nodes], catIdx) => {
    // Golden angle placement for cluster centers
    const angle = catIdx * GOLDEN_ANGLE;
    const dist = catCount === 1 ? 0 : (220 + catCount * 40) * (0.6 + (catIdx / 80) * 0.55);
    const clusterCx = cx + Math.cos(angle) * dist;
    const clusterCy = cy + Math.sin(angle) * dist;

    // Sort nodes by queryCount
    const sorted = [...nodes].sort((a, b) => (b.queryCount || 0) - (a.queryCount || 0));

    // Place nodes within cluster using golden angle — wider spread
    let maxDx = 0,
      maxDy = 0;
    const nodeSpread = sorted.length > 80 ? 42 : sorted.length > 30 ? 35 : 28;
    sorted.forEach((node, nIdx) => {
      const nAngle = nIdx * GOLDEN_ANGLE * 2.4;
      const nDist = 40 + Math.sqrt(nIdx) * nodeSpread;
      const nx = clusterCx + Math.cos(nAngle) * nDist;
      const ny = clusterCy + Math.sin(nAngle) * nDist * 0.75;

      maxDx = Math.max(maxDx, Math.abs(nx - clusterCx));
      maxDy = Math.max(maxDy, Math.abs(ny - clusterCy));

      const isShared = !!sharedNodeInfo[node.id];
      nodeLayout[node.id] = {
        id: node.id,
        x: nx,
        y: ny,
        isShared,
        sharedCategories: sharedNodeInfo[node.id] || [cat],
        queryCount: node.queryCount || 0,
        connections: connectionCounts[node.id] || 0,
      };
    });

    clusterList.push({
      category: cat,
      nodes: sorted,
      cx: clusterCx,
      cy: clusterCy,
      rx: Math.max(maxDx + 50, 80),
      ry: Math.max(maxDy + 40, 60),
    });
  });

  // Reposition shared nodes to midpoint between their cluster centers
  Object.entries(sharedNodeInfo).forEach(([nodeId, cats]) => {
    if (!nodeLayout[nodeId]) return;
    const relevantClusters = clusterList.filter((c) => cats.includes(c.category));
    if (relevantClusters.length < 2) return;

    const midX = relevantClusters.reduce((s, c) => s + c.cx, 0) / relevantClusters.length;
    const midY = relevantClusters.reduce((s, c) => s + c.cy, 0) / relevantClusters.length;
    nodeLayout[nodeId].x = midX + (Math.random() - 0.5) * 30;
    nodeLayout[nodeId].y = midY + (Math.random() - 0.5) * 20;
  });

  // suppress unused variable
  void clusterRadius;

  return { clusters: clusterList, layoutNodes: nodeLayout };
}

// Force-directed layout for expanded cluster drill-down
export function computeForceLayout(
  expandedCluster: string | null,
  clusters: ClusterData[],
  topicLinks: TopicLink[]
): {
  positions: { id: string; x: number; y: number }[];
  links: TopicLink[];
  sortedNodes: Node[];
  vw?: number;
  vh?: number;
} {
  if (!expandedCluster) return { positions: [], links: [], sortedNodes: [] };
  const cl = clusters.find((c) => c.category === expandedCluster);
  if (!cl) return { positions: [], links: [], sortedNodes: [] };

  const sorted = [...cl.nodes].sort((a, b) => (b.queryCount || 0) - (a.queryCount || 0));
  const n = sorted.length;

  // Tree layout: hubs at top, children branching below
  const idSet = new Set(sorted.map((nd) => nd.id));
  const intLinks = topicLinks.filter((l) => idSet.has(l.source) && idSet.has(l.target));

  // Build adjacency
  const adj: Record<string, string[]> = {};
  sorted.forEach((nd) => {
    adj[nd.id] = [];
  });
  intLinks.forEach((l) => {
    if (adj[l.source]) adj[l.source].push(l.target);
    if (adj[l.target]) adj[l.target].push(l.source);
  });

  // Pick top hubs (most connected or most queried)
  const hubCount = Math.min(Math.max(3, Math.ceil(n / 15)), 8);
  const hubs = sorted.slice(0, hubCount);
  const hubIds = new Set(hubs.map((h) => h.id));

  // --- Force-directed simulation ---
  const positions: Record<string, { x: number; y: number }> = {};

  const cx = 500,
    cy = 400;
  const initRadius = Math.min(500, 120 + n * 3);

  hubs.forEach((hub, i) => {
    const angle = (i / hubs.length) * Math.PI * 2;
    positions[hub.id] = {
      x: cx + Math.cos(angle) * initRadius * 0.6,
      y: cy + Math.sin(angle) * initRadius * 0.6,
    };
  });

  sorted.forEach((nd) => {
    if (positions[nd.id]) return;
    const connHubs = (adj[nd.id] || []).filter((id) => hubIds.has(id));
    const parentHub = connHubs[0] || hubs[0]?.id;
    const parentPos = positions[parentHub] || { x: cx, y: cy };
    positions[nd.id] = {
      x: parentPos.x + (Math.random() - 0.5) * initRadius * 0.8,
      y: parentPos.y + (Math.random() - 0.5) * initRadius * 0.8,
    };
  });

  const iterations = 150;
  const repulsionStrength = 5000;
  const attractionStrength = 0.004;
  const centeringStrength = 0.001;
  const damping = 0.9;

  const vel: Record<string, { vx: number; vy: number }> = {};
  sorted.forEach((nd) => {
    vel[nd.id] = { vx: 0, vy: 0 };
  });

  for (let iter = 0; iter < iterations; iter++) {
    const temp = 1 - iter / iterations;

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i].id,
          b = sorted[j].id;
        const pa = positions[a],
          pb = positions[b];
        let dx = pa.x - pb.x,
          dy = pa.y - pb.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 60) dist = 60;
        const force = (repulsionStrength * temp) / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        vel[a].vx += fx;
        vel[a].vy += fy;
        vel[b].vx -= fx;
        vel[b].vy -= fy;
      }
    }

    intLinks.forEach((link) => {
      const pa = positions[link.source],
        pb = positions[link.target];
      if (!pa || !pb) return;
      const dx = pb.x - pa.x,
        dy = pb.y - pa.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = dist * attractionStrength * temp;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      vel[link.source].vx += fx;
      vel[link.source].vy += fy;
      vel[link.target].vx -= fx;
      vel[link.target].vy -= fy;
    });

    sorted.forEach((nd) => {
      const p = positions[nd.id];
      vel[nd.id].vx += (cx - p.x) * centeringStrength;
      vel[nd.id].vy += (cy - p.y) * centeringStrength;
    });

    sorted.forEach((nd) => {
      const v = vel[nd.id],
        p = positions[nd.id];
      v.vx *= damping;
      v.vy *= damping;
      const maxV = 10 * temp + 1;
      v.vx = Math.max(-maxV, Math.min(maxV, v.vx));
      v.vy = Math.max(-maxV, Math.min(maxV, v.vy));
      p.x += v.vx;
      p.y += v.vy;
    });
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  sorted.forEach((nd) => {
    const p = positions[nd.id];
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });

  const graphW = maxX - minX || 400;
  const graphH = maxY - minY || 400;
  const padding = 80;
  const vw = Math.max(900, graphW + padding * 2);
  const vh = Math.max(700, graphH + padding * 2);

  const pos: { id: string; x: number; y: number }[] = sorted.map((nd) => ({
    id: nd.id,
    x: padding + ((positions[nd.id].x - minX) / graphW) * (vw - padding * 2),
    y: padding + ((positions[nd.id].y - minY) / graphH) * (vh - padding * 2),
  }));

  return { positions: pos, links: intLinks, sortedNodes: sorted, vw, vh };
}

// Build analyse modal data for a selected topic
export function buildAnalyseData(
  selectedTopic: Node | null,
  layoutNodes: Record<string, LayoutNode>,
  visibleLinks: TopicLink[],
  filteredNodes: Node[]
): AnalyseData | null {
  if (!selectedTopic) return null;
  const node = layoutNodes[selectedTopic.id];
  if (!node) return null;

  const conns = visibleLinks.filter(
    (l) => l.source === selectedTopic.id || l.target === selectedTopic.id
  );
  const connectedNodes = conns
    .map((l) => {
      const otherId = l.source === selectedTopic.id ? l.target : l.source;
      const otherNode = filteredNodes.find((n) => n.id === otherId);
      return otherNode
        ? {
            id: otherId,
            name: otherNode.name,
            category: otherNode.category || 'other',
            strength: l.strength,
          }
        : null;
    })
    .filter(Boolean) as { id: string; name: string; category: string; strength: number }[];

  const clusterBreakdown: Record<string, number> = {};
  clusterBreakdown[selectedTopic.category || 'other'] =
    clusterBreakdown[selectedTopic.category || 'other'] || 0;
  connectedNodes.forEach((cn) => {
    clusterBreakdown[cn.category] = (clusterBreakdown[cn.category] || 0) + 1;
  });

  const internalConns = connectedNodes.filter(
    (cn) => cn.category === (selectedTopic.category || 'other')
  ).length;
  const crossConns = connectedNodes.length - internalConns;

  return {
    queryCount: selectedTopic.queryCount || 0,
    connections: connectedNodes.length,
    clusters: Object.keys(clusterBreakdown).length,
    clusterBreakdown,
    internalConns,
    crossConns,
    topConnections: connectedNodes.sort((a, b) => b.strength - a.strength).slice(0, 5),
    bridges: connectedNodes
      .filter((cn) => cn.category !== (selectedTopic.category || 'other'))
      .map((cn) => cn.category)
      .filter((v, i, a) => a.indexOf(v) === i),
  };
}
