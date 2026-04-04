'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Node } from './MindMap';
import type { MindMapDiagramViewProps, Discussion, TopicLink } from './MindMapUtils';
import {
  buildConnectionCounts,
  buildSharedNodeInfo,
  computeClusplotLayout,
  computeForceLayout,
  buildAnalyseData,
} from './MindMapLayout';
import MindMapClusterDetail from './MindMapClusterDetail';
import MindMapAnalysePanel from './MindMapAnalysePanel';
import MindMapSVG from './MindMapSVG';
import { MindMapDiagramHeader, MindMapDiagramBottomBar } from './MindMapDiagramSVG';

export default function MindMapDiagramView({
  userId,
  nodes: propNodes,
  searchQuery = '',
  onNodeSelect,
  onNodeAction,
  onContinueToChat,
  propTopicLinks,
}: MindMapDiagramViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Core state
  const [allNodes, setAllNodes] = useState<Node[]>([]);
  const [dims, setDims] = useState({ width: 800, height: 600 });

  // Pan/Zoom
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const hasInitialized = useRef(false);

  // Node interaction
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Node | null>(null);
  const [analyseOpen, setAnalyseOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  // Discussion panel
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [discussionError, setDiscussionError] = useState<string | null>(null);
  const [discussionTotal, setDiscussionTotal] = useState(0);

  // Topic-to-topic correlation links
  const [topicLinks, setTopicLinks] = useState<TopicLink[]>([]);

  // Living graph
  const [isLive, setIsLive] = useState(false);
  const [pulsingClusters, setPulsingClusters] = useState<Set<string>>(new Set());
  const prevNodeCountRef = useRef(0);

  // Search
  const [localSearch, setLocalSearch] = useState('');

  // Fetch nodes
  useEffect(() => {
    if (propNodes && propNodes.length > 0) {
      setAllNodes(propNodes);
      if (propTopicLinks && propTopicLinks.length > 0) {
        setTopicLinks(propTopicLinks);
      } else {
        const fetchLinks = async () => {
          try {
            const res = await fetch('/api/mindmap/data');
            if (res.ok) {
              const data = await res.json();
              setTopicLinks(data.links || []);
            }
          } catch (error) {
            console.error('Failed to fetch links:', error);
          }
        };
        fetchLinks();
      }
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch('/api/mindmap/data');
        if (!res.ok) return;
        const data = await res.json();
        setAllNodes(data.nodes || []);
        setTopicLinks(data.links || []);
      } catch (error) {
        console.error('Failed to fetch:', error);
      }
    };
    fetchData();
  }, [userId, propNodes, propTopicLinks]);

  // Living graph — poll every 30s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/mindmap/data');
        if (!res.ok) return;
        const data = await res.json();
        const newNodes: Node[] = data.nodes || [];
        setTopicLinks(data.links || []);

        if (prevNodeCountRef.current > 0 && newNodes.length > prevNodeCountRef.current) {
          const oldIds = new Set(allNodes.map((n) => n.id));
          const newCats = new Set<string>();
          newNodes.forEach((n) => {
            if (!oldIds.has(n.id)) newCats.add(n.category || 'other');
          });
          if (newCats.size > 0) {
            setPulsingClusters(newCats);
            setTimeout(() => setPulsingClusters(new Set()), 2000);
          }
          setAllNodes(newNodes);
        }
        prevNodeCountRef.current = newNodes.length;
        setIsLive(true);
      } catch {
        setIsLive(false);
      }
    };

    if (propNodes && propNodes.length > 0) return;
    prevNodeCountRef.current = allNodes.length;

    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [propNodes, allNodes]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDims({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Native wheel listener for zoom (passive: false)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(2.5, Math.max(0.3, z - e.deltaY * 0.001)));
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const displayNodes = propNodes || allNodes;
  const effectiveSearch = searchQuery || localSearch;

  // Filter nodes by search
  const filteredNodes = useMemo(() => {
    if (!effectiveSearch) return displayNodes;
    const q = effectiveSearch.toLowerCase();
    return displayNodes.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q) ||
        n.category?.toLowerCase().includes(q)
    );
  }, [displayNodes, effectiveSearch]);

  // Delegate to extracted layout functions
  const connectionCounts = useMemo(() => buildConnectionCounts(topicLinks), [topicLinks]);
  const sharedNodeInfo = useMemo(
    () => buildSharedNodeInfo(filteredNodes, topicLinks),
    [filteredNodes, topicLinks]
  );
  const { clusters, layoutNodes } = useMemo(
    () => computeClusplotLayout(filteredNodes, dims, sharedNodeInfo, connectionCounts),
    [filteredNodes, dims, sharedNodeInfo, connectionCounts]
  );

  // Auto-center on first render
  useEffect(() => {
    if (hasInitialized.current || dims.width <= 100) return;
    if (Object.keys(layoutNodes).length === 0) return;
    hasInitialized.current = true;
    const z = 0.85;
    setPan({
      x: (dims.width / 2) * (1 - z),
      y: (dims.height / 2) * (1 - z),
    });
  }, [dims, layoutNodes]);

  // Reset drill-down pan/zoom when cluster changes
  useEffect(() => {}, [expandedCluster]);

  // Get node position with user drag override
  const getPos = useCallback(
    (id: string): { x: number; y: number } | null => {
      if (nodePositions[id]) return nodePositions[id];
      const ln = layoutNodes[id];
      return ln ? { x: ln.x, y: ln.y } : null;
    },
    [nodePositions, layoutNodes]
  );

  // Visible cross-cluster links — only between visible top-5 nodes
  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>();
    clusters.forEach((c) => c.nodes.slice(0, 5).forEach((n) => ids.add(n.id)));
    return ids;
  }, [clusters]);

  const visibleLinks = useMemo(() => {
    const nodeIds = new Set(Object.keys(layoutNodes));
    return topicLinks.filter(
      (link) =>
        nodeIds.has(link.source) &&
        nodeIds.has(link.target) &&
        visibleNodeIds.has(link.source) &&
        visibleNodeIds.has(link.target)
    );
  }, [topicLinks, layoutNodes, visibleNodeIds]);

  // Connected topics for hover highlight
  const connectedTopicIds = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const connected = new Set<string>();
    visibleLinks.forEach((link) => {
      if (link.source === hoveredNode) connected.add(link.target);
      if (link.target === hoveredNode) connected.add(link.source);
    });
    return connected;
  }, [hoveredNode, visibleLinks]);

  // Force-directed layout for expanded cluster drill-down
  const forceLayoutNodes = useMemo(
    () => computeForceLayout(expandedCluster, clusters, topicLinks),
    [expandedCluster, clusters, topicLinks]
  );

  // Fetch discussions
  const fetchDiscussions = useCallback(
    async (topicId: string, offset = 0) => {
      setLoadingDiscussions(true);
      setDiscussionError(null);
      try {
        const res = await fetch(`/api/mindmap/topics/${topicId}/queries?limit=10&offset=${offset}`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setDiscussions(offset > 0 ? [...discussions, ...data.discussions] : data.discussions || []);
        setDiscussionTotal(data.total || 0);
      } catch {
        setDiscussionError('Failed to load discussions');
      } finally {
        setLoadingDiscussions(false);
      }
    },
    [discussions]
  );

  // Event handlers — pan/zoom/drag
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (
      e.target === svgRef.current ||
      ((e.target as Element).closest('svg') === svgRef.current &&
        !(e.target as Element).closest('g[data-node]'))
    ) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: panStartRef.current.panX + (e.clientX - panStartRef.current.x),
        y: panStartRef.current.panY + (e.clientY - panStartRef.current.y),
      });
    } else if (draggedNode && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      setNodePositions((prev) => ({ ...prev, [draggedNode]: { x, y } }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNode(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggedNode(nodeId);
  };

  const handleNodeClick = (e: React.MouseEvent, node: Node) => {
    e.stopPropagation();
    if (draggedNode) return;

    if (selectedTopic?.id === node.id) {
      closeAnalyse();
      return;
    }

    setSelectedTopic(node);
    setAnalyseOpen(true);
    fetchDiscussions(node.id);
    onNodeSelect?.({ id: node.id, name: node.name, category: node.category || undefined });
  };

  const closeAnalyse = () => {
    setSelectedTopic(null);
    setAnalyseOpen(false);
    setAiInsight(null);
    setAiLoading(false);
    setDiscussions([]);
    setDiscussionError(null);
    onNodeSelect?.(null);
  };

  // AI analyse — quick insight about the topic
  const handleAnalyse = async () => {
    if (!selectedTopic || !analyseData) return;
    setAiLoading(true);
    setAiInsight(null);
    try {
      const prompt = `In exactly 2 short sentences (max 40 words total), explain the significance of "${selectedTopic.name}" (category: ${selectedTopic.category}) in relation to its connected topics: ${analyseData.topConnections.map((c) => c.name).join(', ')}. Focus on why these connections matter.`;
      const res = await fetch('/api/quick-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt }),
      });
      const data = await res.json();
      setAiInsight(data.content || data.response || 'Analysis unavailable.');
    } catch {
      setAiInsight('Analysis temporarily unavailable.');
    }
    setAiLoading(false);
  };

  // Zoom controls
  const zoomIn = () => setZoom((z) => Math.min(2.5, z + 0.2));
  const zoomOut = () => setZoom((z) => Math.max(0.3, z - 0.2));
  const fitView = () => {
    setZoom(0.85);
    setPan({
      x: (dims.width / 2) * (1 - 0.85),
      y: (dims.height / 2) * (1 - 0.85),
    });
    setNodePositions({});
  };

  // Stats
  const totalTopics = filteredNodes.length;
  const totalClusters = clusters.length;
  const sharedCount = Object.keys(sharedNodeInfo).length;

  // Build analyse modal data
  const analyseData = useMemo(
    () => buildAnalyseData(selectedTopic, layoutNodes, visibleLinks, filteredNodes),
    [selectedTopic, layoutNodes, visibleLinks, filteredNodes]
  );

  // Suppress unused vars from state kept for future use
  void loadingDiscussions;
  void discussionError;
  void discussionTotal;
  void discussions;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#fafbfc] dark:bg-[#0a0a0a]">
      {/* Header toolbar */}
      <MindMapDiagramHeader
        totalTopics={totalTopics}
        totalClusters={totalClusters}
        sharedCount={sharedCount}
        isLive={isLive}
        localSearch={localSearch}
        setLocalSearch={setLocalSearch}
        zoom={zoom}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        fitView={fitView}
      />

      {/* Main graph area */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        style={{ cursor: isPanning ? 'grabbing' : draggedNode ? 'grabbing' : 'grab' }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none dark:opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, #e2e8f0 0.7px, transparent 0.7px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* SVG Canvas */}
        <MindMapSVG
          svgRef={svgRef}
          pan={pan}
          zoom={zoom}
          clusters={clusters}
          layoutNodes={layoutNodes}
          filteredNodes={filteredNodes}
          displayNodes={displayNodes}
          visibleLinks={visibleLinks}
          connectedTopicIds={connectedTopicIds}
          connectionCounts={connectionCounts}
          hoveredNode={hoveredNode}
          analyseOpen={analyseOpen}
          pulsingClusters={pulsingClusters}
          getPos={getPos}
          setHoveredNode={setHoveredNode}
          setExpandedCluster={setExpandedCluster}
          handleNodeClick={handleNodeClick}
          handleNodeMouseDown={handleNodeMouseDown}
        />
      </div>

      {/* Expanded cluster detail view */}
      {expandedCluster && (
        <MindMapClusterDetail
          expandedCluster={expandedCluster}
          clusters={clusters}
          forceLayoutNodes={forceLayoutNodes}
          connectionCounts={connectionCounts}
          onNodeAction={onNodeAction}
          onClose={() => setExpandedCluster(null)}
        />
      )}

      {/* Analyse popup */}
      <MindMapAnalysePanel
        analyseOpen={analyseOpen}
        selectedTopic={selectedTopic}
        analyseData={analyseData}
        clusters={clusters}
        aiLoading={aiLoading}
        aiInsight={aiInsight}
        onAnalyse={handleAnalyse}
        onClose={closeAnalyse}
        onContinueToChat={onContinueToChat}
      />

      {/* Bottom bar */}
      <MindMapDiagramBottomBar visibleLinksCount={visibleLinks.length} />
    </div>
  );
}
