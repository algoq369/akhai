'use client'

import { useState } from 'react'

export default function IdeaGenerator() {
  const [prompt, setPrompt] = useState('')
  const [ideas, setIdeas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const generateIdeas = async () => {
    if (!prompt.trim()) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/idea-factory/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (res.ok) {
        const data = await res.json()
        setIdeas(data.ideas || [])
      }
    } catch (error) {
      console.error('Failed to generate ideas:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-mono text-relic-slate">Idea Generator</h2>
      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What should my agent help with? How can I make my agent more creative?"
          className="w-full px-4 py-3 border border-relic-mist bg-relic-white text-sm text-relic-slate focus:outline-none focus:border-relic-slate"
          rows={4}
        />
        <button
          onClick={generateIdeas}
          disabled={loading || !prompt.trim()}
          className="px-4 py-2 bg-relic-slate text-relic-white text-xs font-mono hover:bg-relic-void transition-colors disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Ideas'}
        </button>
        {ideas.length > 0 && (
          <div className="space-y-2">
            {ideas.map((idea, i) => (
              <div key={i} className="p-4 border border-relic-mist bg-relic-ghost/30">
                <p className="text-sm text-relic-slate">{idea}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

