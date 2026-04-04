'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { MindmapNode, ResponseMindmapProps } from './ResponseMindmap.types';
import { NODE_GRADIENTS, METHODOLOGY_COLORS } from './ResponseMindmap.types';
import { generateTailoredFooter, extractConcepts } from './ResponseMindmap.utils';
import MindmapDetailPanel from './ResponseMindmapDetailPanel';
import MindmapFooter from './ResponseMindmapFooter';

export { shouldShowMindmap } from './ResponseMindmap.utils';

export default function ResponseMindmap({
  content,
  topics,
  isVisible,
  onToggle,
  methodology = 'auto',
  query,
}: ResponseMindmapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<MindmapNode | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const accentGradient = METHODOLOGY_COLORS[methodology] || METHODOLOGY_COLORS.auto;

  const nodes = useMemo(() => {
    if (topics && topics.length > 0) {
      const mapped: MindmapNode[] = [
        {
          id: 'root',
          label: 'Key Concepts',
          fullText: 'Main concepts from this response',
          level: 0,
        },
      ];
      topics.slice(0, 8).forEach((topic, i) => {
        mapped.push({
          id: topic.id || `topic-${i}`,
          label: topic.name.length > 20 ? topic.name.substring(0, 17) + '...' : topic.name,
          fullText: topic.name,
          level: 1,
          parentId: 'root',
          category: topic.category,
        });
      });
      return mapped;
    }
    return extractConcepts(content);
  }, [content, topics]);

  const shouldShow = nodes.length >= 4;
  const conceptCount = nodes.length - 1;

  // Generate tailored footer content
  const footerContent = useMemo(
    () => generateTailoredFooter(query, nodes, topics, methodology, isExpanded, selectedNode),
    [query, nodes, topics, methodology, isExpanded, selectedNode]
  );

  // Dynamic dimensions based on expansion and detail panel
  const dimensions = useMemo(() => {
    if (selectedNode) {
      return { width: 640, height: 450 };
    }
    return isExpanded ? { width: 640, height: 450 } : { width: 380, height: 260 };
  }, [isExpanded, selectedNode]);

  // Calculate positions
  const positionedNodes = useMemo(() => {
    const graphWidth = selectedNode ? 400 : dimensions.width;
    const centerX = graphWidth / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(graphWidth, dimensions.height) * 0.3;

    return nodes.map((node) => {
      if (nodePositions[node.id]) {
        return { ...node, ...nodePositions[node.id] };
      }

      if (node.level === 0) {
        return { ...node, x: centerX, y: centerY };
      }

      const childNodes = nodes.filter((n) => n.level === 1);
      const childIndex = childNodes.findIndex((n) => n.id === node.id);
      const angleStep = (2 * Math.PI) / childNodes.length;
      const angle = angleStep * childIndex - Math.PI / 2;

      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
  }, [nodes, dimensions, nodePositions, selectedNode]);

  // Drag handlers
  const handleMouseDown = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      if (selectedNode) return; // Don't drag when detail panel is open
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setDraggedNode(nodeId);
    },
    [selectedNode]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !draggedNode || !svgRef.current) return;

      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const graphWidth = selectedNode ? 400 : dimensions.width;
      const x = Math.max(40, Math.min(graphWidth - 40, e.clientX - rect.left));
      const y = Math.max(40, Math.min(dimensions.height - 40, e.clientY - rect.top));

      setNodePositions((prev) => ({
        ...prev,
        [draggedNode]: { x, y },
      }));
    },
    [isDragging, draggedNode, dimensions, selectedNode]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedNode(null);
  }, []);

  const handleNodeClick = useCallback(
    (node: MindmapNode, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isDragging) {
        setSelectedNode(selectedNode?.id === node.id ? null : node);
        if (!isExpanded) setIsExpanded(true);
      }
    },
    [isDragging, selectedNode, isExpanded]
  );

  // Close detail panel when clicking outside
  const handleCanvasClick = useCallback(() => {
    if (selectedNode) setSelectedNode(null);
  }, [selectedNode]);

  if (!shouldShow && !isVisible) {
    const conceptLabels = nodes.filter((n) => n.level > 0).map((n) => n.fullText);

    return (
      <div className="mt-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <SparklesIcon className="w-4 h-4 text-slate-500" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              Topic Map
            </span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500">
              {conceptLabels.length} concepts
            </span>
          </div>
          <div className="p-3">
            {conceptLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {conceptLabels.map((label, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-400"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                Extracting concepts from response
              </p>
            )}
            <p className="text-[9px] text-slate-400 dark:text-slate-500 italic mt-3">
              Topic map — extracted concepts
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 ${
          isVisible
            ? 'bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-750 text-slate-600 dark:text-slate-300 shadow-sm'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        <SparklesIcon
          className={`w-3.5 h-3.5 transition-transform ${isVisible ? 'rotate-12' : 'group-hover:rotate-12'}`}
        />
        <span>{isVisible ? 'hide map' : 'visualize'}</span>
        {!isVisible && (
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[9px]">
            {conceptCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div
              className={`relative rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden transition-all duration-300 ${
                isExpanded ? 'shadow-xl' : 'shadow-md'
              } bg-gradient-to-br from-white via-slate-50/30 to-slate-100/20 dark:from-slate-900 dark:via-slate-850 dark:to-slate-800/50`}
              style={{
                width: dimensions.width,
              }}
            >
              {/* Dot pattern */}
              <div
                className="absolute inset-0 opacity-30 dark:opacity-10 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)`,
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Controls */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                {selectedNode && (
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsExpanded(!isExpanded);
                    if (!isExpanded) setSelectedNode(null);
                  }}
                  className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
                >
                  {isExpanded ? (
                    <ArrowsPointingInIcon className="w-4 h-4" />
                  ) : (
                    <ArrowsPointingOutIcon className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Instruction */}
              {isExpanded && !selectedNode && (
                <div className="absolute top-3 left-3 z-20">
                  <span className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Click node to explore • Drag to move
                  </span>
                </div>
              )}

              {/* Content Area */}
              <div className="flex">
                {/* SVG Canvas */}
                <svg
                  ref={svgRef}
                  width={selectedNode ? 400 : dimensions.width}
                  height={dimensions.height}
                  className="relative z-10"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={handleCanvasClick}
                  style={{ cursor: isDragging ? 'grabbing' : 'default' }}
                >
                  <defs>
                    <linearGradient id="rootGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={accentGradient.from} />
                      <stop offset="100%" stopColor={accentGradient.to} />
                    </linearGradient>
                    {NODE_GRADIENTS.map((grad, i) => (
                      <linearGradient
                        key={i}
                        id={`nodeGrad${i}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor={grad.from} />
                        <stop offset="100%" stopColor={grad.to} />
                      </linearGradient>
                    ))}
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
                    </filter>
                  </defs>

                  {/* Connections */}
                  {positionedNodes
                    .filter((n) => n.parentId)
                    .map((node) => {
                      const parent = positionedNodes.find((p) => p.id === node.parentId);
                      if (!parent || !node.x || !node.y || !parent.x || !parent.y) return null;

                      const isActive = hoveredNode === node.id || selectedNode?.id === node.id;

                      const mx = (parent.x + node.x) / 2;
                      const my = (parent.y + node.y) / 2 - 15;

                      return (
                        <motion.path
                          key={`line-${node.id}`}
                          d={`M ${parent.x} ${parent.y} Q ${mx} ${my} ${node.x} ${node.y}`}
                          fill="none"
                          stroke={isActive ? accentGradient.from : '#e2e8f0'}
                          strokeWidth={isActive ? 2.5 : 1.5}
                          strokeLinecap="round"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: isActive ? 1 : 0.5 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                        />
                      );
                    })}

                  {/* Nodes */}
                  {positionedNodes.map((node, index) => {
                    const isRoot = node.level === 0;
                    const isHovered = hoveredNode === node.id;
                    const isSelected = selectedNode?.id === node.id;
                    const isDraggingThis = draggedNode === node.id;

                    const nodeWidth = isRoot ? (isExpanded ? 140 : 110) : isExpanded ? 120 : 90;
                    const nodeHeight = isRoot ? 40 : 34;
                    const gradientId = isRoot
                      ? 'rootGrad'
                      : `nodeGrad${index % NODE_GRADIENTS.length}`;

                    if (!node.x || !node.y) return null;

                    return (
                      <motion.g
                        key={node.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                          scale: isDraggingThis ? 1.1 : isSelected ? 1.05 : 1,
                          opacity: 1,
                        }}
                        transition={{ duration: 0.25, delay: index * 0.03 }}
                        onMouseEnter={() => setHoveredNode(node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        onMouseDown={(e) => handleMouseDown(node.id, e)}
                        onClick={(e) => handleNodeClick(node, e)}
                        style={{
                          cursor: selectedNode ? 'pointer' : isDragging ? 'grabbing' : 'grab',
                        }}
                      >
                        <rect
                          x={node.x - nodeWidth / 2}
                          y={node.y - nodeHeight / 2}
                          width={nodeWidth}
                          height={nodeHeight}
                          rx={4}
                          fill={`url(#${gradientId})`}
                          filter={
                            isHovered || isSelected || isDraggingThis
                              ? 'url(#glow)'
                              : 'url(#shadow)'
                          }
                          className="transition-all duration-150"
                          style={{
                            stroke: isSelected ? '#3b82f6' : 'transparent',
                            strokeWidth: isSelected ? 3 : 0,
                          }}
                        />

                        <text
                          x={node.x}
                          y={node.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize={isExpanded ? 12 : 11}
                          fontWeight={isRoot ? 600 : 500}
                          fontFamily="'JetBrains Mono', ui-monospace, monospace"
                          className="select-none pointer-events-none"
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                        >
                          {node.label.length > (isExpanded ? 18 : 14)
                            ? node.label.substring(0, isExpanded ? 16 : 12) + '…'
                            : node.label}
                        </text>
                      </motion.g>
                    );
                  })}
                </svg>

                {/* Detail Panel */}
                {selectedNode && (
                  <MindmapDetailPanel
                    selectedNode={selectedNode}
                    nodes={nodes}
                    conceptCount={conceptCount}
                    accentGradient={accentGradient}
                    showLinkMenu={showLinkMenu}
                    onShowLinkMenuToggle={() => setShowLinkMenu(!showLinkMenu)}
                    onSelectNode={setSelectedNode}
                    onHideLinkMenu={() => setShowLinkMenu(false)}
                  />
                )}
              </div>

              {/* Footer */}
              <MindmapFooter
                conceptCount={conceptCount}
                nodes={nodes}
                methodology={methodology}
                accentGradient={accentGradient}
                footerContent={footerContent}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
