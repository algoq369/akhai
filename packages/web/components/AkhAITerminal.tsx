'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TerminalLine {
  id: string
  type: 'input' | 'output' | 'system' | 'error'
  content: string
  timestamp: number
}

interface AkhaiTerminalProps {
  isOpen: boolean
  onClose: () => void
}

const SYSTEM_COMMANDS = {
  help: `
AKHAI TERMINAL v0.1 - Sovereign Intelligence Interface

COMMANDS:
  /help          Show this help
  /clear         Clear terminal
  /instinct      Toggle Instinct Mode
  /model [name]  Switch model (claude, deepseek, mistral, grok, gtp)
  /status        Show system status
  /history       Show command history
  /export        Export conversation
  
MODES:
  Standard input sends to AI with current methodology
  Prefix with ! for shell-style commands
  
SHORTCUTS:
  Ctrl+L         Clear screen
  Ctrl+K         Kill current process
  Up/Down        Navigate history
  Tab            Autocomplete

Powered by Claude Opus 4.5 + AkhAI Sovereign Technology
`,
  status: `
AKHAI SYSTEM STATUS
───────────────────────────────────────
  Engine:     Claude Opus 4.5
  Mode:       Standard (Instinct: OFF)
  Model:      claude
  Guard:      ACTIVE
  Tokens:     0 / 50,000 daily
  Latency:    ~2.3s avg
  Uptime:     Active
───────────────────────────────────────
`,
  clear: 'CLEAR',
}

export default function AkhaiTerminal({ isOpen, onClose }: AkhaiTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: '0', type: 'system', content: 'AKHAI Terminal v0.1 - Type /help for commands', timestamp: Date.now() }
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [instinctMode, setInstinctMode] = useState(false)
  const [currentModel, setCurrentModel] = useState('claude')
  
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])
  
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines])
  
  const addLine = (type: TerminalLine['type'], content: string) => {
    setLines(prev => [...prev, {
      id: Date.now().toString(),
      type,
      content,
      timestamp: Date.now()
    }])
  }
  
  const handleCommand = async (cmd: string) => {
    const trimmed = cmd.trim()
    if (!trimmed) return
    
    // Add to history
    setHistory(prev => [...prev, trimmed])
    setHistoryIndex(-1)
    
    // Show input
    addLine('input', `› ${trimmed}`)
    setInput('')
    
    // Handle system commands
    if (trimmed.startsWith('/')) {
      const [command, ...args] = trimmed.slice(1).split(' ')
      
      switch (command.toLowerCase()) {
        case 'help':
          addLine('system', SYSTEM_COMMANDS.help)
          break
        case 'clear':
          setLines([{ id: '0', type: 'system', content: 'Terminal cleared', timestamp: Date.now() }])
          break
        case 'status':
          addLine('system', SYSTEM_COMMANDS.status.replace('Instinct: OFF', `Instinct: ${instinctMode ? 'ON' : 'OFF'}`).replace('model:      claude', `model:      ${currentModel}`))
          break
        case 'instinct':
          setInstinctMode(!instinctMode)
          addLine('system', `Instinct Mode: ${!instinctMode ? 'ACTIVATED' : 'DEACTIVATED'}`)
          break
        case 'model':
          if (args[0] && ['claude', 'deepseek', 'mistral', 'grok', 'gtp'].includes(args[0])) {
            setCurrentModel(args[0])
            addLine('system', `Model switched to: ${args[0]}`)
          } else {
            addLine('error', 'Invalid model. Use: claude, deepseek, mistral, grok, gtp')
          }
          break
        case 'history':
          addLine('system', history.length ? history.map((h, i) => `${i + 1}. ${h}`).join('\n') : 'No history')
          break
        case 'export':
          const text = lines.map(l => l.content).join('\n')
          navigator.clipboard.writeText(text)
          addLine('system', 'Conversation copied to clipboard')
          break
        default:
          addLine('error', `Unknown command: ${command}. Type /help for available commands.`)
      }
      return
    }
    
    // Send to AI
    setIsProcessing(true)
    try {
      // TODO: Connect to actual API
      // For now, simulate response
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (instinctMode) {
        addLine('output', `▸ SIGNAL\n${trimmed.length > 20 ? 'Complex query requires deep analysis.' : 'Simple query processed.'}\n\n▸ OPTIMAL\nThis is a simulated Instinct Mode response. Connect to API for real analysis.`)
      } else {
        addLine('output', `Response to: "${trimmed}"\n\nThis is a simulated terminal response. The AkhAI Terminal will connect to Claude Opus 4.5 with full AkhAI methodology integration.`)
      }
    } catch (error) {
      addLine('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCommand(input)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setInput(history[history.length - 1 - newIndex] || '')
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(history[history.length - 1 - newIndex] || '')
      } else {
        setHistoryIndex(-1)
        setInput('')
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setLines([{ id: '0', type: 'system', content: 'Terminal cleared', timestamp: Date.now() }])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }
  
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="absolute inset-4 md:inset-10 lg:inset-20 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                akhai terminal
              </span>
              {instinctMode && (
                <span className="text-[8px] font-mono text-amber-400 uppercase tracking-wider px-1.5 py-0.5 bg-amber-400/10 rounded">
                  instinct
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
              <span>{currentModel}</span>
            </div>
          </div>
          
          {/* Terminal Output */}
          <div 
            ref={terminalRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-sm"
          >
            {lines.map(line => (
              <div 
                key={line.id}
                className={`whitespace-pre-wrap mb-2 ${
                  line.type === 'input' ? 'text-emerald-400' :
                  line.type === 'output' ? 'text-slate-300' :
                  line.type === 'error' ? 'text-red-400' :
                  'text-slate-500'
                }`}
              >
                {line.content}
              </div>
            ))}
            {isProcessing && (
              <div className="text-slate-500 animate-pulse">
                Processing...
              </div>
            )}
          </div>
          
          {/* Input */}
          <div className="border-t border-slate-800 bg-slate-900/30 p-3">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">›</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={instinctMode ? "instinct query..." : "enter command..."}
                className="flex-1 bg-transparent text-slate-200 font-mono text-sm focus:outline-none placeholder:text-slate-600"
                disabled={isProcessing}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
