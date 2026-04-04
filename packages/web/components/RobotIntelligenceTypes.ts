'use client';

import {
  CpuChipIcon,
  BoltIcon,
  EyeIcon,
  CogIcon,
  SignalIcon,
  BeakerIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// ============================================
// TYPES
// ============================================

export interface RobotPart {
  id: string;
  name: string;
  category: 'core' | 'sensory' | 'motor' | 'cognitive' | 'energy';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  status: 'active' | 'developing' | 'planned' | 'offline';
  metrics: {
    efficiency: number;
    development: number;
    energyConsumption: number;
    reliability: number;
  };
  subComponents: SubComponent[];
  position: { x: number; y: number; size: 'lg' | 'md' | 'sm' };
  connections: string[];
}

export interface SubComponent {
  id: string;
  name: string;
  status: 'active' | 'developing' | 'planned';
  value: number;
  unit: string;
}

// ============================================
// ROBOT PART DATA
// ============================================

export const robotParts: RobotPart[] = [
  {
    id: 'neural-core',
    name: 'Neural Processing Core',
    category: 'cognitive',
    icon: CpuChipIcon,
    description: 'Central AI reasoning engine with 7 methodology pathways',
    status: 'active',
    metrics: { efficiency: 94, development: 100, energyConsumption: 35, reliability: 98 },
    position: { x: 50, y: 12, size: 'lg' },
    connections: ['grounding-guard', 'side-canal', 'memory-bank'],
    subComponents: [
      { id: 'direct-path', name: 'Direct Pathway', status: 'active', value: 98, unit: '%' },
      { id: 'cod-path', name: 'Chain of Draft', status: 'active', value: 95, unit: '%' },
      { id: 'tot-path', name: 'Tree of Thoughts', status: 'active', value: 92, unit: '%' },
      { id: 'react-path', name: 'ReAct Loop', status: 'active', value: 89, unit: '%' },
      { id: 'pas-path', name: 'Plan-and-Solve', status: 'developing', value: 78, unit: '%' },
      { id: 'sc-path', name: 'Self-Consistency', status: 'developing', value: 82, unit: '%' },
      { id: 'auto-router', name: 'Auto Router', status: 'active', value: 96, unit: '%' },
    ],
  },
  {
    id: 'grounding-guard',
    name: 'Grounding Guard System',
    category: 'cognitive',
    icon: EyeIcon,
    description: 'Real-time verification and anti-hallucination shield',
    status: 'active',
    metrics: { efficiency: 91, development: 95, energyConsumption: 18, reliability: 96 },
    position: { x: 25, y: 28, size: 'md' },
    connections: ['neural-core', 'fact-engine'],
    subComponents: [
      { id: 'hype-detect', name: 'Hype Detection', status: 'active', value: 94, unit: '%' },
      { id: 'echo-detect', name: 'Echo Chamber', status: 'active', value: 88, unit: '%' },
      { id: 'drift-detect', name: 'Drift Monitor', status: 'active', value: 91, unit: '%' },
      { id: 'fact-check', name: 'Fact Verification', status: 'active', value: 93, unit: '%' },
      { id: 'bias-scan', name: 'Bias Scanner', status: 'active', value: 87, unit: '%' },
      { id: 'suggest-engine', name: 'Suggestions', status: 'active', value: 95, unit: '%' },
    ],
  },
  {
    id: 'side-canal',
    name: 'Side Canal Context',
    category: 'sensory',
    icon: SignalIcon,
    description: 'Autonomous topic extraction and context injection',
    status: 'active',
    metrics: { efficiency: 88, development: 90, energyConsumption: 12, reliability: 94 },
    position: { x: 75, y: 28, size: 'md' },
    connections: ['neural-core', 'mind-map'],
    subComponents: [
      { id: 'topic-extract', name: 'Topic Extraction', status: 'active', value: 92, unit: '%' },
      { id: 'synopsis-gen', name: 'Synopsis Generator', status: 'active', value: 89, unit: '%' },
      { id: 'suggest-flow', name: 'Suggestion Flow', status: 'active', value: 91, unit: '%' },
      { id: 'context-inject', name: 'Context Injection', status: 'active', value: 88, unit: '%' },
    ],
  },
  {
    id: 'mind-map',
    name: 'Mind Map Visualizer',
    category: 'sensory',
    icon: SparklesIcon,
    description: 'Interactive knowledge graph with D3 visualization',
    status: 'active',
    metrics: { efficiency: 85, development: 88, energyConsumption: 8, reliability: 92 },
    position: { x: 85, y: 48, size: 'sm' },
    connections: ['side-canal', 'memory-bank'],
    subComponents: [
      { id: 'graph-render', name: 'Graph Renderer', status: 'active', value: 94, unit: '%' },
      { id: 'ai-insights', name: 'AI Insights', status: 'active', value: 86, unit: '%' },
      { id: 'table-view', name: 'Table View', status: 'active', value: 95, unit: '%' },
    ],
  },
  {
    id: 'memory-bank',
    name: 'Memory Bank',
    category: 'core',
    icon: BeakerIcon,
    description: 'Long-term knowledge storage and retrieval system',
    status: 'developing',
    metrics: { efficiency: 72, development: 65, energyConsumption: 22, reliability: 85 },
    position: { x: 50, y: 48, size: 'md' },
    connections: ['neural-core', 'mind-map', 'query-engine'],
    subComponents: [
      { id: 'session-mem', name: 'Session Memory', status: 'active', value: 98, unit: '%' },
      { id: 'user-profile', name: 'User Profiles', status: 'developing', value: 45, unit: '%' },
      { id: 'knowledge-base', name: 'Knowledge Base', status: 'planned', value: 15, unit: '%' },
    ],
  },
  {
    id: 'query-engine',
    name: 'Query Processing Engine',
    category: 'motor',
    icon: CogIcon,
    description: 'Request handling and response orchestration',
    status: 'active',
    metrics: { efficiency: 96, development: 98, energyConsumption: 28, reliability: 99 },
    position: { x: 25, y: 48, size: 'md' },
    connections: ['neural-core', 'memory-bank', 'api-gateway'],
    subComponents: [
      { id: 'stream-handler', name: 'Stream Handler', status: 'active', value: 99, unit: '%' },
      { id: 'method-select', name: 'Method Selector', status: 'active', value: 97, unit: '%' },
      { id: 'response-format', name: 'Response Formatter', status: 'active', value: 98, unit: '%' },
    ],
  },
  {
    id: 'api-gateway',
    name: 'API Gateway',
    category: 'motor',
    icon: AdjustmentsHorizontalIcon,
    description: 'External communication and provider routing',
    status: 'active',
    metrics: { efficiency: 94, development: 92, energyConsumption: 15, reliability: 97 },
    position: { x: 15, y: 68, size: 'sm' },
    connections: ['query-engine', 'power-core'],
    subComponents: [
      { id: 'claude-api', name: 'Claude API', status: 'active', value: 100, unit: '%' },
      { id: 'litellm-route', name: 'LiteLLM Router', status: 'developing', value: 60, unit: '%' },
      { id: 'sovereign-api', name: 'Sovereign Models', status: 'planned', value: 10, unit: '%' },
    ],
  },
  {
    id: 'fact-engine',
    name: 'Fact Verification Engine',
    category: 'cognitive',
    icon: ChartBarIcon,
    description: 'External data validation and citation system',
    status: 'developing',
    metrics: { efficiency: 78, development: 70, energyConsumption: 20, reliability: 82 },
    position: { x: 15, y: 38, size: 'sm' },
    connections: ['grounding-guard', 'api-gateway'],
    subComponents: [
      {
        id: 'source-verify',
        name: 'Source Verification',
        status: 'developing',
        value: 65,
        unit: '%',
      },
      { id: 'citation-gen', name: 'Citation Generator', status: 'planned', value: 30, unit: '%' },
      {
        id: 'confidence-score',
        name: 'Confidence Scoring',
        status: 'active',
        value: 88,
        unit: '%',
      },
    ],
  },
  {
    id: 'power-core',
    name: 'Power Management',
    category: 'energy',
    icon: BoltIcon,
    description: 'Resource allocation and cost optimization',
    status: 'active',
    metrics: { efficiency: 89, development: 85, energyConsumption: 5, reliability: 95 },
    position: { x: 50, y: 75, size: 'md' },
    connections: ['api-gateway', 'neural-core'],
    subComponents: [
      { id: 'cost-track', name: 'Cost Tracking', status: 'active', value: 95, unit: '%' },
      { id: 'model-route', name: 'Model Routing', status: 'active', value: 90, unit: '%' },
      { id: 'cache-layer', name: 'Response Cache', status: 'developing', value: 55, unit: '%' },
    ],
  },
  {
    id: 'legend-mode',
    name: 'Legend Mode Engine',
    category: 'cognitive',
    icon: SparklesIcon,
    description: 'Premium R&D tier with Claude Opus 4.5',
    status: 'active',
    metrics: { efficiency: 98, development: 95, energyConsumption: 45, reliability: 99 },
    position: { x: 85, y: 68, size: 'sm' },
    connections: ['neural-core', 'power-core'],
    subComponents: [
      { id: 'opus-engine', name: 'Opus 4.5 Engine', status: 'active', value: 100, unit: '%' },
      { id: 'style-enhance', name: 'Style Enhancement', status: 'active', value: 92, unit: '%' },
      { id: 'depth-analysis', name: 'Deep Analysis', status: 'active', value: 96, unit: '%' },
    ],
  },
];

// ============================================
// STATUS COLORS
// ============================================

export const statusColors = {
  active: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-600',
    border: 'border-emerald-400',
    glow: 'shadow-emerald-500/30',
  },
  developing: {
    bg: 'bg-amber-500',
    text: 'text-amber-600',
    border: 'border-amber-400',
    glow: 'shadow-amber-500/30',
  },
  planned: {
    bg: 'bg-slate-400',
    text: 'text-slate-500',
    border: 'border-slate-300',
    glow: 'shadow-slate-500/20',
  },
  offline: {
    bg: 'bg-red-500',
    text: 'text-red-600',
    border: 'border-red-400',
    glow: 'shadow-red-500/30',
  },
};

export const categoryColors = {
  core: 'from-violet-500 to-purple-600',
  sensory: 'from-cyan-500 to-blue-600',
  motor: 'from-emerald-500 to-teal-600',
  cognitive: 'from-amber-500 to-orange-600',
  energy: 'from-rose-500 to-pink-600',
};
