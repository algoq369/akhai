/**
 * HOOKS INDEX
 * 
 * Central export for all custom hooks
 */

// Depth Annotations
// TODO: Re-enable DepthProvider and useDepthConfig after fixing TypeScript JSX context issue
export {
  useDepthAnnotations,
  // DepthProvider, // Commented out - not integrated yet
  // useDepthConfig, // Commented out - not integrated yet
  useDepthExpand,
} from './useDepthAnnotations'

// Re-export types
export type {
  DepthAnnotation,
  DepthConfig,
  AnnotationType,
} from '@/lib/depth-annotations'
