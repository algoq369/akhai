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

  // Assign remaining nodes to nearest hub
  const hubChildren: Record<string, Node[]> = {};
  hubs.forEach((h) => {
    hubChildren[h.id] = [];
  });
  const assigned = new Set(hubIds);

  // First pass: assign nodes connected to hubs
  sorted.forEach((nd) => {
    if (assigned.has(nd.id)) return;
    const connectedHubs = (adj[nd.id] || []).filter((id) => hubIds.has(id));
    if (connectedHubs.length > 0) {
      hubChildren[connectedHubs[0]].push(nd);
      assigned.add(nd.id);
    }
  });
  // Second pass: assign remaining to hub with fewest children
  sorted.forEach((nd) => {
    if (assigned.has(nd.id)) return;
    const minHub = hubs.reduce((a, b) =>
      hubChildren[a.id].length <= hubChildren[b.id].length ? a : b
    );
    hubChildren[minHub.id].push(nd);
    assigned.add(nd.id);
  });

  // Position: hubs across top row, children in columns below each hub
  const colW = n > 50 ? 180 : n > 20 ? 160 : 140;
  const rowH = n > 30 ? 40 : 35;
  const padTop = 60,
    padLeft = 40;
  const vw = Math.max(900, hubCount * colW + padLeft * 2);

  const pos: { id: string; x: number; y: number }[] = [];
  hubs.forEach((hub, hi) => {
    const cx = padLeft + hi * colW + colW / 2;
    pos.push({ id: hub.id, x: cx, y: padTop });

    const children = hubChildren[hub.id].sort((a, b) => (b.queryCount || 0) - (a.queryCount || 0));
    children.forEach((child, ci) => {
      pos.push({ id: child.id, x: cx, y: padTop + (ci + 1) * rowH });
    });
  });

  const maxChildren = Math.max(...Object.values(hubChildren).map((c) => c.length), 0);
  const vh = padTop + (maxChildren + 2) * rowH;

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
