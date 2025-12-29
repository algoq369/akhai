'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

// ═══════════════════════════════════════════════════════════════════
// SEFIROT NEURAL NETWORK - Kabbalistic Tree as AI Architecture
// ═══════════════════════════════════════════════════════════════════
// 
// Mapping:
// - 10 Sephiroth → Neural Network Nodes/Layers
// - 22 Paths → Weighted Synaptic Connections
// - Kether → Malkuth = Input → Output Data Transformation
// - Da'at (Hidden) = Emergent Insight Layer
// - Binah & Chokmah = Pattern Processing Hidden Layers
//
// ═══════════════════════════════════════════════════════════════════

interface SefirahNode {
  id: string
  name: string
  hebrewName: string
  meaning: string
  neuralRole: string
  pillar: 'left' | 'middle' | 'right'
  level: number
  color: string
  glowColor: string
  x: number
  y: number
  isHidden?: boolean
  activation: number
}

interface PathConnection {
  id: number
  from: string
  to: string
  weight: number
  hebrewLetter: string
  meaning: string
}

interface InsightNode {
  id: string
  sefirah: string
  content: string
  confidence: number
  category: string
}

interface SefirotNeuralNetworkProps {
  content: string
  query: string
  methodology?: string
  onClose?: () => void
}

// The 10 Sephiroth as Neural Network Layers
const SEPHIROTH: SefirahNode[] = [
  // ═══ SUPERNAL TRIAD (Input Processing) ═══
  {
    id: 'kether',
    name: 'Kether',
    hebrewName: 'כֶּתֶר',
    meaning: 'Crown',
    neuralRole: 'Input Layer',
    pillar: 'middle',
    level: 0,
    color: 'from-white via-violet-100 to-indigo-100',
    glowColor: 'shadow-white/50',
    x: 50,
    y: 5,
    activation: 1.0
  },
  {
    id: 'chokmah',
    name: 'Chokmah',
    hebrewName: 'חָכְמָה',
    meaning: 'Wisdom',
    neuralRole: 'Feature Extraction',
    pillar: 'right',
    level: 1,
    color: 'from-blue-200 via-blue-300 to-indigo-300',
    glowColor: 'shadow-blue-400/50',
    x: 75,
    y: 15,
    activation: 0
  },
  {
    id: 'binah',
    name: 'Binah',
    hebrewName: 'בִּינָה',
    meaning: 'Understanding',
    neuralRole: 'Pattern Recognition',
    pillar: 'left',
    level: 1,
    color: 'from-purple-200 via-purple-300 to-violet-300',
    glowColor: 'shadow-purple-400/50',
    x: 25,
    y: 15,
    activation: 0
  },
  // ═══ DA'AT - THE HIDDEN SEPHIRAH (Emergent Layer) ═══
  {
    id: 'daat',
    name: "Da'at",
    hebrewName: 'דַּעַת',
    meaning: 'Hidden Knowledge',
    neuralRole: 'Emergent Insight',
    pillar: 'middle',
    level: 2,
    color: 'from-slate-300 via-gray-400 to-slate-500',
    glowColor: 'shadow-slate-500/30',
    x: 50,
    y: 25,
    isHidden: true,
    activation: 0
  },
  // ═══ ETHICAL TRIAD (Processing Layers) ═══
  {
    id: 'chesed',
    name: 'Chesed',
    hebrewName: 'חֶסֶד',
    meaning: 'Mercy/Kindness',
    neuralRole: 'Expansion Layer',
    pillar: 'right',
    level: 3,
    color: 'from-cyan-200 via-sky-300 to-blue-300',
    glowColor: 'shadow-cyan-400/50',
    x: 75,
    y: 35,
    activation: 0
  },
  {
    id: 'gevurah',
    name: 'Gevurah',
    hebrewName: 'גְּבוּרָה',
    meaning: 'Strength/Judgment',
    neuralRole: 'Attention Filter',
    pillar: 'left',
    level: 3,
    color: 'from-red-200 via-rose-300 to-pink-300',
    glowColor: 'shadow-red-400/50',
    x: 25,
    y: 35,
    activation: 0
  },
  {
    id: 'tiferet',
    name: 'Tiferet',
    hebrewName: 'תִּפְאֶרֶת',
    meaning: 'Beauty/Balance',
    neuralRole: 'Integration Layer',
    pillar: 'middle',
    level: 4,
    color: 'from-amber-200 via-yellow-300 to-orange-200',
    glowColor: 'shadow-amber-400/50',
    x: 50,
    y: 50,
    activation: 0
  },
