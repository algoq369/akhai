/**
 * Canvas Components
 *
 * Draggable whiteboard/canvas UI for AkhAI
 */

import DraggablePanel from './DraggablePanel'
import QueryCardsPanel from './QueryCardsPanel'
import VisualsPanel from './VisualsPanel'
import AILayersPanel from './AILayersPanel'
import TreesPanel from './TreesPanel'
import CanvasWorkspace from './CanvasWorkspace'

export { DraggablePanel }

export { QueryCardsPanel }
export type { QueryCard } from './QueryCardsPanel'

// Legacy VisualsPanel (kept for backward compatibility)
export { VisualsPanel }
export type { VisualNode, VisualEdge } from './VisualsPanel'

// New AI Layers Panel (replaces VisualsPanel in center panel)
export { AILayersPanel }
export type { AIInsight, AILayersPanelProps } from './AILayersPanel'

export { TreesPanel }

export { CanvasWorkspace }
export default CanvasWorkspace
