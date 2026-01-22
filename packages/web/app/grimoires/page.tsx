'use client'

/**
 * GRIMOIRES - White Minimalist with Integrated Chat
 */

import { useGrimoireStore } from '@/lib/stores/grimoire-store'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DarkModeToggle from '@/components/DarkModeToggle'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

export default function GrimoiresPage() {
  const router = useRouter()
  const { grimoires, createGrimoire, deleteGrimoire, getMemories, getFiles, getLinks, updateGrimoire, addFile, addLink, deleteFile, deleteLink } = useGrimoireStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [instructions, setInstructions] = useState('')
  const [editingInstructions, setEditingInstructions] = useState(false)
  const [newLinkUrl, setNewLinkUrl] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selected = selectedId ? grimoires.find(g => g.id === selectedId) : null
  const memories = selected ? getMemories(selected.id) : []
  const files = selected ? getFiles(selected.id) : []
  const links = selected ? getLinks(selected.id) : []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reset messages when switching grimoires
  useEffect(() => {
    setMessages([])
  }, [selectedId])

  const handleCreate = () => {
    if (newName.trim()) {
      const grimoire = createGrimoire(newName.trim())
      setNewName('')
      setShowCreate(false)
      setSelectedId(grimoire.id)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !selected) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      createdAt: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/simple-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage.content,
          methodology: 'direct',
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          grimoireId: selected.id,
          grimoireMemories: memories,
          grimoireInstructions: selected.instructions
        })
      })

      const data = await response.json()

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        createdAt: Date.now()
      }])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selected) return
    addFile(selected.id, {
      name: file.name,
      type: file.type,
      size: file.size,
      path: `/uploads/${selected.id}/${file.name}`,
      grimoireId: selected.id
    })
  }

  const handleAddLink = () => {
    if (!newLinkUrl.trim() || !selected) return
    try {
      addLink(selected.id, {
        url: newLinkUrl.trim(),
        title: new URL(newLinkUrl).hostname,
        grimoireId: selected.id
      })
      setNewLinkUrl('')
    } catch (error) {
      console.error('Invalid URL')
    }
  }

  const saveInstructions = () => {
    if (selected) {
      updateGrimoire(selected.id, { instructions })
      setEditingInstructions(false)
    }
  }

  return (
    <div className="h-screen flex bg-white dark:bg-relic-void text-slate-900 dark:text-relic-ghost font-mono overflow-hidden">
      {/* Left Sidebar - Grimoires List */}
      <div className="w-56 border-r border-slate-200 dark:border-relic-slate/30 flex flex-col bg-white dark:bg-relic-void/50">
        <div className="p-2 border-b border-slate-200 dark:border-relic-slate/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-[9px] text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white">
              ← back
            </Link>
            <DarkModeToggle />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="text-[9px] text-slate-500 dark:text-relic-silver hover:text-slate-900 dark:hover:text-white"
          >
            + new
          </button>
        </div>

        {showCreate && (
          <div className="p-2 border-b border-slate-200 dark:border-relic-slate/30 bg-slate-50 dark:bg-relic-slate/10">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="name"
              className="w-full bg-white dark:bg-relic-void/80 border border-slate-200 dark:border-relic-slate/30 px-2 py-1 text-[10px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-relic-silver outline-none mb-1"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-1">
              <button
                onClick={handleCreate}
                className="px-2 py-0.5 bg-slate-900 dark:bg-white text-white dark:text-relic-void text-[9px]"
              >
                create
              </button>
              <button
                onClick={() => { setShowCreate(false); setNewName('') }}
                className="px-2 py-0.5 text-slate-400 dark:text-relic-silver text-[9px]"
              >
                cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {grimoires.length === 0 ? (
            <div className="p-3 text-center text-[10px] text-slate-400 dark:text-relic-silver">
              <p>no grimoires</p>
            </div>
          ) : (
            grimoires
              .filter(g => !g.archived)
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((g) => {
                const mems = getMemories(g.id)
                const fils = getFiles(g.id)
                const lnks = getLinks(g.id)
                const isSelected = selectedId === g.id

                return (
                  <Link
                    key={g.id}
                    href={`/grimoires/${g.id}`}
                    className={`block p-2 border-b border-slate-100 dark:border-relic-slate/30 cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-100 dark:bg-relic-slate/20' : 'hover:bg-slate-50 dark:hover:bg-relic-slate/10'
                    }`}
                  >
                    <div className="text-[11px] font-medium mb-0.5 truncate text-slate-900 dark:text-white">{g.name}</div>
                    <div className="text-[9px] text-slate-400 dark:text-relic-ghost flex items-center gap-2">
                      <span>{mems.length}m</span>
                      <span>{fils.length}f</span>
                      <span>{lnks.length}l</span>
                    </div>
                  </Link>
                )
              })
          )}
        </div>
      </div>

      {/* Center - Chat */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-white dark:bg-relic-void">
          {/* Header */}
          <div className="p-2 border-b border-slate-200 dark:border-relic-slate/30 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-900 dark:text-white">{selected.name}</div>
              <div className="text-[9px] text-slate-400 dark:text-relic-ghost">
                {memories.length} memories · {files.length} files · {links.length} links
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMessages([])}
                className="text-[9px] text-slate-400 dark:text-relic-silver hover:text-slate-600 dark:hover:text-white"
              >
                new chat
              </button>
              <button
                onClick={() => {
                  if (confirm(`delete "${selected.name}"?`)) {
                    deleteGrimoire(selected.id)
                    setSelectedId(null)
                    setMessages([])
                  }
                }}
                className="text-[9px] text-slate-400 dark:text-relic-silver hover:text-red-500 dark:hover:text-red-400"
              >
                delete
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 bg-white dark:bg-relic-void">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg text-slate-300 dark:text-relic-slate mb-2">◈</div>
                  <div className="text-xs text-slate-500 dark:text-relic-silver mb-1">{selected.name}</div>
                  <div className="text-[10px] text-slate-400 dark:text-relic-ghost">start conversation</div>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-2">
                    <div className="w-4 h-4 rounded bg-slate-100 dark:bg-relic-slate/20 flex items-center justify-center text-[8px] text-slate-600 dark:text-relic-ghost flex-shrink-0 mt-0.5">
                      {msg.role === 'user' ? 'u' : 'a'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-slate-400 dark:text-relic-ghost mb-0.5">
                        {msg.role === 'user' ? 'you' : 'akhai'}
                      </div>
                      <div className="text-[11px] leading-relaxed text-slate-700 dark:text-relic-silver whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            {isLoading && (
              <div className="flex gap-2 max-w-2xl mx-auto">
                <div className="w-4 h-4 rounded bg-slate-100 dark:bg-relic-slate/20 flex items-center justify-center text-[8px] text-slate-600 dark:text-relic-ghost">a</div>
                <div className="flex-1">
                  <div className="text-[9px] text-slate-400 dark:text-relic-ghost mb-0.5">akhai</div>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-slate-400 dark:bg-relic-silver rounded-full animate-pulse" />
                    <div className="w-1 h-1 bg-slate-400 dark:bg-relic-silver rounded-full animate-pulse delay-100" />
                    <div className="w-1 h-1 bg-slate-400 dark:bg-relic-silver rounded-full animate-pulse delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 dark:border-relic-slate/30 p-2 bg-white dark:bg-relic-void">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
              <div className="flex gap-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                  placeholder="message"
                  rows={1}
                  className="flex-1 bg-white dark:bg-relic-void/80 border border-slate-200 dark:border-relic-slate/30 px-2 py-1 text-[11px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-relic-silver outline-none resize-none"
                  style={{ minHeight: '28px', maxHeight: '80px' }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-2 bg-slate-900 dark:bg-white text-white dark:text-relic-void text-[11px] disabled:opacity-50"
                >
                  ↑
                </button>
              </div>
              <div className="mt-1 text-[9px] text-slate-400 dark:text-relic-ghost">sonnet 4.5</div>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-relic-void/50">
          <div className="text-center">
            <div className="text-2xl text-slate-200 dark:text-relic-slate mb-3">◈</div>
            <div className="text-xs text-slate-400 dark:text-relic-silver mb-4">grimoires</div>
            <div className="text-[10px] text-slate-400 dark:text-relic-ghost max-w-xs leading-relaxed">
              select a grimoire or create new
            </div>
          </div>
        </div>
      )}

      {/* Right Sidebar - Tools */}
      {selected && (
        <div className="w-52 border-l border-slate-200 dark:border-relic-slate/30 flex flex-col bg-white dark:bg-relic-void/50 overflow-y-auto">
          {/* Instructions */}
          <div className="p-2 border-b border-slate-200 dark:border-relic-slate/30">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[9px] text-slate-500 dark:text-relic-silver uppercase">instructions</div>
              {!editingInstructions ? (
                <button
                  onClick={() => {
                    setEditingInstructions(true)
                    setInstructions(selected.instructions || '')
                  }}
                  className="text-[9px] text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white"
                >
                  edit
                </button>
              ) : (
                <button
                  onClick={saveInstructions}
                  className="text-[9px] text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                >
                  save
                </button>
              )}
            </div>
            {editingInstructions ? (
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="custom behavior"
                className="w-full bg-white dark:bg-relic-void/80 border border-slate-200 dark:border-relic-slate/30 p-1 text-[10px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-relic-silver outline-none resize-none"
                rows={4}
              />
            ) : (
              <div className="text-[10px] text-slate-600 dark:text-relic-silver leading-relaxed">
                {selected.instructions || <span className="text-slate-400 dark:text-relic-ghost">none</span>}
              </div>
            )}
          </div>

          {/* Files */}
          <div className="p-2 border-b border-slate-200 dark:border-relic-slate/30">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[9px] text-slate-500 dark:text-relic-silver uppercase">files ({files.length})</div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[9px] text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white"
              >
                + add
              </button>
            </div>
            {files.length > 0 ? (
              <div className="space-y-1">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-relic-slate/10 hover:bg-slate-100 dark:hover:bg-relic-slate/20 group">
                    <div className="flex-1 min-w-0 text-[10px] truncate text-slate-600 dark:text-relic-silver">
                      {file.name}
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-relic-ghost">{(file.size / 1024).toFixed(1)}kb</div>
                    <button
                      onClick={() => deleteFile(file.id)}
                      className="opacity-0 group-hover:opacity-100 text-[9px] text-slate-400 dark:text-relic-silver hover:text-red-500 dark:hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 dark:text-relic-ghost">no files</div>
            )}
            <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
          </div>

          {/* Links */}
          <div className="p-2 border-b border-slate-200 dark:border-relic-slate/30">
            <div className="text-[9px] text-slate-500 dark:text-relic-silver uppercase mb-1">links ({links.length})</div>
            <div className="flex gap-1 mb-1">
              <input
                type="url"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                placeholder="https://"
                className="flex-1 bg-white dark:bg-relic-void/80 border border-slate-200 dark:border-relic-slate/30 px-1 py-0.5 text-[10px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-relic-silver outline-none"
              />
              <button
                onClick={handleAddLink}
                className="px-1 text-[9px] bg-slate-100 dark:bg-relic-slate/20 hover:bg-slate-200 dark:hover:bg-relic-slate/30 text-slate-600 dark:text-relic-ghost"
              >
                +
              </button>
            </div>
            {links.length > 0 && (
              <div className="space-y-1">
                {links.map((link) => (
                  <div key={link.id} className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-relic-slate/10 hover:bg-slate-100 dark:hover:bg-relic-slate/20 group">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 text-[10px] truncate text-slate-600 dark:text-relic-silver hover:text-slate-900 dark:hover:text-white"
                    >
                      {link.title || link.url}
                    </a>
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="opacity-0 group-hover:opacity-100 text-[9px] text-slate-400 dark:text-relic-silver hover:text-red-500 dark:hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Memory */}
          <div className="p-2 flex-1">
            <div className="text-[9px] text-slate-500 dark:text-relic-silver uppercase mb-1">memory ({memories.length})</div>
            {memories.length > 0 ? (
              <div className="space-y-1">
                {memories.slice(0, 8).map((m) => (
                  <div key={m.id} className="p-1 bg-slate-50 dark:bg-relic-slate/10 text-[10px]">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="px-1 bg-slate-200 dark:bg-relic-slate/30 text-slate-600 dark:text-relic-ghost text-[8px] uppercase">{m.type}</span>
                      <span className="text-[8px] text-slate-400 dark:text-relic-ghost">{Math.round(m.confidence * 100)}%</span>
                    </div>
                    <p className="text-slate-600 dark:text-relic-silver leading-tight line-clamp-2">{m.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 dark:text-relic-ghost">chat to build memory</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
