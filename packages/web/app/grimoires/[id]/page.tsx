'use client'

/**
 * GRIMOIRE - White Minimalist Single View
 */

import { useGrimoireStore } from '@/lib/stores/grimoire-store'
import { useParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
// GrimoireConsoleDrawer removed - keeping only instinct and sefirot tree buttons
import { useSettingsStore } from '@/lib/stores/settings-store'
import TreeConfigurationModal from '@/components/TreeConfigurationModal'
import SuperSaiyanIcon from '@/components/SuperSaiyanIcon'
import { InstinctModeConsole } from '@/components/InstinctModeConsole'
import MethodologyFrame from '@/components/MethodologyFrame'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  gnostic?: any
}

export default function GrimoirePage() {
  const { id } = useParams()
  const grimoireId = id as string

  const {
    grimoires,
    getMemories,
    getFiles,
    getLinks,
    setActiveGrimoire,
    updateGrimoire,
    addFile,
    addLink,
    deleteFile,
    deleteLink
  } = useGrimoireStore()

  const grimoire = grimoires.find(g => g.id === grimoireId)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [instructions, setInstructions] = useState(grimoire?.instructions || '')
  const [editingInstructions, setEditingInstructions] = useState(false)
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [methodology, setMethodology] = useState<string>('direct')
  const { settings } = useSettingsStore()
  const [showSefirotTree, setShowSefirotTree] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const memories = getMemories(grimoireId)
  const files = getFiles(grimoireId)
  const links = getLinks(grimoireId)

  useEffect(() => {
    if (grimoireId) setActiveGrimoire(grimoireId)
    return () => setActiveGrimoire(null)
  }, [grimoireId, setActiveGrimoire])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

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
          methodology: methodology,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          grimoireId,
          grimoireMemories: memories,
          grimoireInstructions: grimoire?.instructions
        })
      })

      const data = await response.json()

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        createdAt: Date.now(),
        gnostic: data.gnostic_metadata
      }])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    addFile(grimoireId, {
      name: file.name,
      type: file.type,
      size: file.size,
      path: `/uploads/${grimoireId}/${file.name}`,
      grimoireId
    })
  }

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return
    try {
      addLink(grimoireId, {
        url: newLinkUrl.trim(),
        title: new URL(newLinkUrl).hostname,
        grimoireId
      })
      setNewLinkUrl('')
    } catch (error) {
      console.error('Invalid URL')
    }
  }

  const saveInstructions = () => {
    if (grimoire) {
      updateGrimoire(grimoireId, { instructions })
      setEditingInstructions(false)
    }
  }

  if (!grimoire) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-[10px]">
          <p className="text-sm mb-2 text-slate-500">not found</p>
          <Link href="/grimoires" className="text-slate-400 hover:text-slate-600">
            ← back
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-white text-slate-900 font-mono overflow-hidden">
      {/* Left - Conversations */}
      <div className="w-48 border-r border-slate-200 flex flex-col">
        <div className="p-2 border-b border-slate-200">
          <Link href="/grimoires" className="text-[9px] text-slate-400 hover:text-slate-600 block mb-1">
            ← all
          </Link>
          <div className="text-xs font-medium truncate">{grimoire.name}</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <button className="w-full px-2 py-1 text-[10px] text-left text-slate-400 hover:bg-slate-50">
              new chat
            </button>
          </div>

          {messages.length > 0 && (
            <div className="px-2 pb-2">
              <div className="px-2 py-1 text-slate-400 text-[9px] uppercase">recent</div>
              <div className="px-2 py-1 bg-slate-50">
                <div className="truncate text-slate-600 text-[10px]">
                  {messages[0]?.content.substring(0, 20)}...
                </div>
                <div className="text-slate-400 text-[9px] mt-0.5">
                  {messages.length} msg
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center - Chat */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-3">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg text-slate-300 mb-2">◈</div>
                <div className="text-xs text-slate-500 mb-1">{grimoire.name}</div>
                <div className="text-[10px] text-slate-400">start conversation</div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-2">
                  <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center text-[8px] flex-shrink-0 mt-0.5">
                    {msg.role === 'user' ? 'u' : 'a'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] text-slate-400 mb-0.5">
                      {msg.role === 'user' ? 'you' : 'akhai'}
                    </div>
                    <div className="text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
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
              <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center text-[8px]">a</div>
              <div className="flex-1">
                <div className="text-[9px] text-slate-400 mb-0.5">akhai</div>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse" />
                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse delay-100" />
                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instinct & Sefirot Tree Buttons */}
        <div className="border-t border-slate-200 p-2">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            {/* Left - Instinct & Sefirot Buttons */}
            <div className="flex items-center gap-3">
              {/* Instinct Button */}
              <button
                onClick={() => {
                  const { settings, setInstinctMode } = useSettingsStore.getState()
                  setInstinctMode(!settings.instinctMode)
                }}
                className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600 hover:text-slate-900 transition-colors"
              >
                <SuperSaiyanIcon size={16} active={settings.instinctMode} />
                <span className={settings.instinctMode ? 'text-slate-900 font-semibold' : ''}>
                  instinct
                </span>
              </button>

              {/* Sefirot Tree Button */}
              <button
                onClick={() => setShowSefirotTree(!showSefirotTree)}
                className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600 hover:text-slate-900 transition-colors"
              >
                <span
                  className="text-[13px] transition-all"
                  style={{
                    color: showSefirotTree ? '#a855f7' : '#64748b',
                    filter: showSefirotTree ? 'drop-shadow(0 0 3px #a855f7)' : 'none'
                  }}
                >
                  ✦
                </span>
                <span className={showSefirotTree ? 'text-purple-600 font-semibold' : ''}>
                  sefirot tree
                </span>
              </button>
            </div>

            {/* Center - Methodology Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-slate-400 uppercase tracking-wider">method</span>
              <MethodologyFrame
                currentMethodology={methodology}
                onMethodologyChange={setMethodology}
                isSubmitting={isLoading}
              />
            </div>

            {/* Right - Spacer for balance */}
            <div className="w-24" />
          </div>
        </div>

        {/* Hermetic Lenses Console - shows when instinct mode is active */}
        <InstinctModeConsole />

        {/* Input */}
        <div className="border-t border-slate-200 p-2">
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
                className="flex-1 bg-white border border-slate-200 px-2 py-1 text-[11px] outline-none resize-none"
                style={{ minHeight: '28px', maxHeight: '80px' }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-2 bg-slate-900 text-white text-[11px] disabled:opacity-50"
              >
                ↑
              </button>
            </div>
            <div className="mt-1 text-[9px] text-slate-400">sonnet 4.5</div>
          </form>
          <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
        </div>
      </div>

      {/* Right - Tools */}
      <div className="w-52 border-l border-slate-200 flex flex-col bg-white overflow-y-auto">
        {/* Instructions */}
        <div className="p-2 border-b border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] text-slate-500 uppercase">instructions</div>
            {!editingInstructions ? (
              <button
                onClick={() => {
                  setEditingInstructions(true)
                  setInstructions(grimoire.instructions || '')
                }}
                className="text-[9px] text-slate-400 hover:text-slate-600"
              >
                edit
              </button>
            ) : (
              <button
                onClick={saveInstructions}
                className="text-[9px] text-green-600 hover:text-green-700"
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
              className="w-full bg-white border border-slate-200 p-1 text-[10px] outline-none resize-none"
              rows={4}
            />
          ) : (
            <div className="text-[10px] text-slate-600 leading-relaxed">
              {grimoire.instructions || <span className="text-slate-400">none</span>}
            </div>
          )}
        </div>

        {/* Files */}
        <div className="p-2 border-b border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] text-slate-500 uppercase">files ({files.length})</div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[9px] text-slate-400 hover:text-slate-600"
            >
              + add
            </button>
          </div>
          {files.length > 0 ? (
            <div className="space-y-1">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-1 p-1 bg-slate-50 hover:bg-slate-100 group">
                  <div className="flex-1 min-w-0 text-[10px] truncate text-slate-600">
                    {file.name}
                  </div>
                  <div className="text-[9px] text-slate-400">{(file.size / 1024).toFixed(1)}kb</div>
                  <button
                    onClick={() => deleteFile(file.id)}
                    className="opacity-0 group-hover:opacity-100 text-[9px] text-slate-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-slate-400">no files</div>
          )}
        </div>

        {/* Links */}
        <div className="p-2 border-b border-slate-200">
          <div className="text-[9px] text-slate-500 uppercase mb-1">links ({links.length})</div>
          <div className="flex gap-1 mb-1">
            <input
              type="url"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
              placeholder="https://"
              className="flex-1 bg-white border border-slate-200 px-1 py-0.5 text-[10px] outline-none"
            />
            <button
              onClick={handleAddLink}
              className="px-1 text-[9px] bg-slate-100 hover:bg-slate-200"
            >
              +
            </button>
          </div>
          {links.length > 0 && (
            <div className="space-y-1">
              {links.map((link) => (
                <div key={link.id} className="flex items-center gap-1 p-1 bg-slate-50 hover:bg-slate-100 group">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0 text-[10px] truncate text-slate-600 hover:text-slate-900"
                  >
                    {link.title || link.url}
                  </a>
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="opacity-0 group-hover:opacity-100 text-[9px] text-slate-400 hover:text-red-500"
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
          <div className="text-[9px] text-slate-500 uppercase mb-1">memory ({memories.length})</div>
          {memories.length > 0 ? (
            <div className="space-y-1">
              {memories.slice(0, 8).map((m) => (
                <div key={m.id} className="p-1 bg-slate-50 text-[10px]">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="px-1 bg-slate-200 text-slate-600 text-[8px] uppercase">{m.type}</span>
                    <span className="text-[8px] text-slate-400">{Math.round(m.confidence * 100)}%</span>
                  </div>
                  <p className="text-slate-600 leading-tight line-clamp-2">{m.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-slate-400">chat to build memory</div>
          )}
        </div>
      </div>

      {/* Tree Configuration Modal */}
      <TreeConfigurationModal
        isOpen={showSefirotTree}
        onClose={() => setShowSefirotTree(false)}
      />
    </div>
  )
}
