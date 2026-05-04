'use client';

import { motion } from 'framer-motion';
import { LinkIcon } from '@heroicons/react/24/outline';
import { LAYER_METADATA } from '@/lib/layer-registry';
import { ConceptNode, LAYER_COLORS } from './insightMindmapTypes';

interface ConceptNodeItemProps {
  node: ConceptNode;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

export default function ConceptNodeItem({
  node,
  index,
  isSelected,
  onSelect,
}: ConceptNodeItemProps) {
  const primaryLayer = node.layerMapping[0];

  return (
    <motion.button
      key={node.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onSelect}
      className={`w-full text-left px-2 py-1.5 rounded-md border transition-all ${
        isSelected
          ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Layers indicator */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: LAYER_COLORS[primaryLayer] }}
          title={LAYER_METADATA[primaryLayer]?.name}
        />
        {/* Label */}
        <span className="flex-1 text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate">
          {node.label}
        </span>
        {/* Connection count */}
        {node.connections.length > 0 && (
          <span
            className="flex items-center gap-0.5 text-[8px] text-slate-400"
            title={`Connected to ${node.connections.length} other concept(s) via shared terminology`}
          >
            <LinkIcon className="w-2.5 h-2.5" />
            {node.connections.length}
          </span>
        )}
      </div>
      {/* Show explanation when selected */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-700"
        >
          <p className="text-[9px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {node.fullText}
          </p>
          <div className="mt-1.5 flex items-center gap-1">
            <span className="text-[8px] text-slate-400">AI Layers:</span>
            {node.layerMapping.map((s) => (
              <span
                key={s}
                className="text-[8px] px-1 py-0.5 rounded"
                style={{
                  backgroundColor: LAYER_COLORS[s] + '20',
                  color: s === 10 ? '#64748b' : LAYER_COLORS[s],
                }}
                title={`${LAYER_METADATA[s]?.name}: ${LAYER_METADATA[s]?.aiRole || 'AI computational layer'}`}
              >
                {LAYER_METADATA[s]?.name}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.button>
  );
}
