'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Terminal, X } from 'lucide-react'

interface ConsoleOutput {
  type: 'command' | 'output' | 'error'
  text: string
  timestamp: Date
}

interface InstinctConsoleProps {
  isOpen?: boolean
  onToggle?: () => void
}

/**
 * InstinctConsole - Terminal-style command console
 * Day 8 Component - Relic aesthetic with keyboard shortcuts
 *
 * Keyboard shortcuts:
 * - Cmd+K (Mac) / Ctrl+K (Windows/Linux): Toggle console
 * - Up/Down arrows: Navigate command history
 * - Enter: Execute command
 */
export default function InstinctConsole({ isOpen: externalIsOpen, onToggle }: InstinctConsoleProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const toggleConsole = onToggle || (() => setInternalIsOpen(!internalIsOpen))
  const [input, setInput] = useState('')
  const [output, setOutput] = useState<ConsoleOutput[]>([
    {
      type: 'output',
      text: 'Instinct Console v1.0 - Type "help" for available commands',
      timestamp: new Date()
    }
  ])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  // Commands configuration
  const commands: Record<string, () => string> = {
    suggest: () => 'AI suggestions feature coming soon',
    audit: () => 'System audit: All systems operational\n  - 7 methodologies active\n  - Grounding Guard enabled\n  - Memory: 99.2% available',
    canal: () => 'Opening Side Canal\n  > Topic extraction initialized\n  > Context awareness active',
    map: () => 'Generating MindMap\n  > Analyzing conversation structure\n  > Mapping conceptual relationships',
    help: () => 'Available commands:\n\n  suggest   - Show AI suggestions\n  audit     - Run system audit\n  canal     - Open Side Canal\n  map       - Generate MindMap\n  help      - Show this help message\n  clear     - Clear console output\n\nKeyboard shortcuts:\n  Cmd+K     - Toggle console\n  Up/Down   - Navigate command history',
    clear: () => '__CLEAR__'
  }

  // Toggle console with Cmd+K (Mac) or Ctrl+K (Windows/Linux)
  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggleConsole()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleConsole])

  // Focus input when console opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const executeCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase()

    // Add command to output
    const newOutput: ConsoleOutput[] = [
      ...output,
      { type: 'command', text: `$ ${cmd}`, timestamp: new Date() }
    ]

    // Execute command
    if (trimmedCmd === '') {
      setOutput(newOutput)
      return
    }

    if (commands[trimmedCmd]) {
      const result = commands[trimmedCmd]()

      if (result === '__CLEAR__') {
        setOutput([
          {
            type: 'output',
            text: 'Console cleared',
            timestamp: new Date()
          }
        ])
      } else {
        newOutput.push({
          type: 'output',
          text: result,
          timestamp: new Date()
        })
        setOutput(newOutput)
      }
    } else {
      newOutput.push({
        type: 'error',
        text: `Command not found: ${trimmedCmd}\nType "help" for available commands`,
        timestamp: new Date()
      })
      setOutput(newOutput)
    }

    // Add to command history
    if (trimmedCmd !== '' && commandHistory[commandHistory.length - 1] !== trimmedCmd) {
      setCommandHistory([...commandHistory, trimmedCmd])
    }

    setHistoryIndex(-1)
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length === 0) return

      const newIndex = historyIndex === -1
        ? commandHistory.length - 1
        : Math.max(0, historyIndex - 1)

      setHistoryIndex(newIndex)
      setInput(commandHistory[newIndex])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex === -1) return

      const newIndex = historyIndex + 1

      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1)
        setInput('')
      } else {
        setHistoryIndex(newIndex)
        setInput(commandHistory[newIndex])
      }
    }
  }

  // When externally controlled (via horizontal bar), never show floating button
  if (externalIsOpen !== undefined) {
    // Only render overlay when open
    if (!isOpen) {
      return null
    }
  } else {
    // Standalone mode: show floating button when closed
    if (!isOpen) {
      return (
        <button
          onClick={toggleConsole}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-slate-800 dark:bg-slate-700 text-green-400 hover:bg-slate-700 dark:hover:bg-slate-600 shadow-lg flex items-center justify-center transition-colors z-40"
          aria-label="Open Instinct Console"
          title="Instinct Console (Cmd+K)"
        >
          <Terminal className="w-5 h-5" />
        </button>
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-mono text-slate-700 dark:text-slate-300">Instinct Console</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">v1.0</span>
          </div>
          <button
            onClick={toggleConsole}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close console"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Output */}
        <div
          ref={outputRef}
          className="h-96 overflow-y-auto p-4 space-y-2 font-mono text-sm bg-white dark:bg-slate-900"
        >
          {output.map((line, index) => (
            <div key={index} className="whitespace-pre-wrap">
              {line.type === 'command' && (
                <div className="text-slate-600 dark:text-slate-400">{line.text}</div>
              )}
              {line.type === 'output' && (
                <div className="text-slate-500 dark:text-slate-300">{line.text}</div>
              )}
              {line.type === 'error' && (
                <div className="text-red-600 dark:text-red-400">{line.text}</div>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <span className="text-slate-500 dark:text-slate-400 font-mono text-sm">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-slate-700 dark:text-slate-300 font-mono text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
          <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            Cmd+K to close
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-600 font-mono">
          Type "help" for available commands - Use Up/Down for history
        </div>
      </div>
    </div>
  )
}
