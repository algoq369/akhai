'use client';

/**
 * Node Editor Popup - extracted from AIConfigUnified.
 * Fixed bottom popup for editing a selected layer's weight.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Layer } from '@/lib/layer-registry';
import { NODE_COLORS, AI_LABELS } from './ai-config-constants';

interface NodeEditorPopupProps {
  selectedNode: Layer | null;
  visible: boolean;
  getWeight: (layer: Layer) => number;
  onWeightChange: (layer: Layer, value: number) => void;
  onClose: () => void;
}

export function NodeEditorPopup({
  selectedNode,
  visible,
  getWeight,
  onWeightChange,
  onClose,
}: NodeEditorPopupProps) {
  return (
    <AnimatePresence>
      {selectedNode && visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white border border-relic-mist
                     rounded shadow-lg p-3 w-64 z-50"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: NODE_COLORS[selectedNode] }}
              />
              <span className="text-[9px] font-medium text-relic-void">
                {AI_LABELS[selectedNode].name}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-relic-silver hover:text-relic-slate text-[10px]"
            >
              ✕
            </button>
          </div>
          <p className="text-[7px] text-relic-silver mb-2 italic">
            {AI_LABELS[selectedNode].concept}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(getWeight(selectedNode) * 100)}
              onChange={(e) => onWeightChange(selectedNode, parseInt(e.target.value))}
              className="flex-1 h-1 bg-relic-ghost rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${NODE_COLORS[selectedNode]} 0%, ${NODE_COLORS[selectedNode]} ${getWeight(selectedNode) * 100}%, #e5e7eb ${getWeight(selectedNode) * 100}%, #e5e7eb 100%)`,
              }}
            />
            <input
              type="number"
              min="0"
              max="100"
              value={Math.round(getWeight(selectedNode) * 100)}
              onChange={(e) => onWeightChange(selectedNode, parseInt(e.target.value) || 0)}
              className="w-10 h-5 text-[9px] text-center border border-relic-mist rounded"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
