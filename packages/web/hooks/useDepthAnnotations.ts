'use client'

/**
 * USE DEPTH ANNOTATIONS HOOK
 * 
 * React hook for integrating depth annotations with streaming responses.
 * Handles real-time detection, state management, and configuration.
 * 
 * Usage:
 *   const { annotations, processChunk, config, setConfig } = useDepthAnnotations()
 *   
 *   // In streaming handler:
 *   onChunk={(chunk) => {
 *     setText(prev => prev + chunk)
 *     processChunk(chunk)
 *   }}
 * 
 * @module useDepthAnnotations
 */

import React, { useState, useCallback, useRef, createContext, useContext, ReactNode } from 'react'
import {
  DepthAnnotation,
  DepthConfig,
  StreamingDepthState,
  createStreamingDepthState,
  processStreamingChunk,
  detectAnnotations,
  getDepthConfig,
  saveDepthConfig,
  DEFAULT_DEPTH_CONFIG,
} from '@/lib/depth-annotations'

interface UseDepthAnnotationsOptions {
  /** Initial configuration override */
  initialConfig?: Partial<DepthConfig>
  /** User context for connection detection */
  userContext?: {
    topics?: string[]
    previousQueries?: string[]
  }
  /** Callback when new annotations are detected */
  onAnnotation?: (annotation: DepthAnnotation) => void
}

interface UseDepthAnnotationsReturn {
  /** Current annotations */
  annotations: DepthAnnotation[]
  /** Current configuration */
  config: DepthConfig
  /** Update configuration */
  setConfig: (config: DepthConfig) => void
  /** Process a streaming chunk */
  processChunk: (chunk: string) => DepthAnnotation[]
  /** Process complete text (non-streaming) */
  processText: (text: string) => DepthAnnotation[]
  /** Reset state for new response */
  reset: () => void
  /** Is currently processing */
  isProcessing: boolean
}

export function useDepthAnnotations(
  options: UseDepthAnnotationsOptions = {}
): UseDepthAnnotationsReturn {
  const { initialConfig, userContext, onAnnotation } = options
  
  // Configuration state
  const [config, setConfigState] = useState<DepthConfig>(() => ({
    ...DEFAULT_DEPTH_CONFIG,
    ...getDepthConfig(),
    ...initialConfig,
  }))
  
  // Annotations state
  const [annotations, setAnnotations] = useState<DepthAnnotation[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Streaming state ref (mutable to avoid re-renders during streaming)
  const streamingState = useRef<StreamingDepthState>(createStreamingDepthState())
  
  // Save config changes
  const setConfig = useCallback((newConfig: DepthConfig) => {
    setConfigState(newConfig)
    saveDepthConfig(newConfig)
  }, [])
  
  // Process a streaming chunk
  const processChunk = useCallback((chunk: string): DepthAnnotation[] => {
    if (!config.enabled) return []
    
    setIsProcessing(true)
    
    const { state, newAnnotations } = processStreamingChunk(
      streamingState.current,
      chunk,
      config,
      userContext
    )
    
    streamingState.current = state
    
    if (newAnnotations.length > 0) {
      setAnnotations(prev => [...prev, ...newAnnotations])
      
      // Trigger callbacks
      newAnnotations.forEach(ann => onAnnotation?.(ann))
    }
    
    setIsProcessing(false)
    return newAnnotations
  }, [config, userContext, onAnnotation])
  
  // Process complete text (non-streaming)
  const processText = useCallback((text: string): DepthAnnotation[] => {
    if (!config.enabled) return []
    
    setIsProcessing(true)
    
    const detected = detectAnnotations(text, config, userContext)
    setAnnotations(detected)
    
    // Trigger callbacks
    detected.forEach(ann => onAnnotation?.(ann))
    
    setIsProcessing(false)
    return detected
  }, [config, userContext, onAnnotation])
  
  // Reset for new response
  const reset = useCallback(() => {
    streamingState.current = createStreamingDepthState()
    setAnnotations([])
    setIsProcessing(false)
  }, [])
  
  return {
    annotations,
    config,
    setConfig,
    processChunk,
    processText,
    reset,
    isProcessing,
  }
}

// ============ PROVIDER FOR GLOBAL DEPTH CONFIG ============

interface DepthContextValue {
  config: DepthConfig
  setConfig: (config: DepthConfig) => void
  globalShowDepth: boolean
  setGlobalShowDepth: (show: boolean) => void
}

const DepthContext = React.createContext<DepthContextValue | null>(null)
const DepthContextProvider = DepthContext.Provider

interface DepthProviderProps {
  children: ReactNode
  initialConfig?: Partial<DepthConfig>
}

export function DepthProvider({ children, initialConfig }: DepthProviderProps) {
  const [config, setConfigState] = useState<DepthConfig>(() => ({
    ...DEFAULT_DEPTH_CONFIG,
    ...getDepthConfig(),
    ...initialConfig,
  }))

  const [globalShowDepth, setGlobalShowDepth] = useState(true)

  const setConfig = useCallback((newConfig: DepthConfig) => {
    setConfigState(newConfig)
    saveDepthConfig(newConfig)
  }, [])

  return React.createElement(
    DepthContextProvider,
    { value: { config, setConfig, globalShowDepth, setGlobalShowDepth } },
    children
  )
}

export function useDepthConfig(): DepthContextValue {
  const context = React.useContext(DepthContext)
  if (!context) {
    // Return defaults if not in provider
    return {
      config: DEFAULT_DEPTH_CONFIG,
      setConfig: () => {},
      globalShowDepth: true,
      setGlobalShowDepth: () => {},
    }
  }
  return context
}

// ============ CONVENIENCE HOOK FOR EXPANDABLE QUERIES ============

interface UseDepthExpandOptions {
  onExpand: (query: string) => void
}

export function useDepthExpand({ onExpand }: UseDepthExpandOptions) {
  const handleExpand = useCallback((query: string) => {
    // Could add analytics, logging, etc.
    onExpand(query)
  }, [onExpand])
  
  return { handleExpand }
}

export default useDepthAnnotations
