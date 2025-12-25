'use client'

import { useState, useMemo } from 'react'
import type { Node } from './MindMap'
import type { TopicInsights } from '@/lib/mindmap-insights'
import { getShapeConfig } from '@/lib/shape-encoder'

interface MindMapTableViewProps {
  nodes: Node[]
  links: Array<{ source: string | Node; target: string | Node; type: string; strength: number }>
  insights: Record<string, TopicInsights>
  onNodeSelect: (node: Node) => void
  selectedNode: Node | null
}

type SortField = 'name' | 'category' | 'queryCount' | 'sentiment'
type SortDirection = 'asc' | 'desc'

export default function MindMapTableView({ nodes, links, insights, onNodeSelect, selectedNode }: MindMapTableViewProps) {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  const categories = useMemo(() => {
    return [...new Set(nodes.map(n => n.category || 'other'))]
  }, [nodes])

  const sortedAndFilteredNodes = useMemo(() => {
    let filtered = filterCategory 
      ? nodes.filter(n => (n.category || 'other') === filterCategory)
      : nodes

    filtered = [...filtered].sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'category':
          aVal = a.category || 'other'
          bVal = b.category || 'other'
          break
        case 'queryCount':
          aVal = a.queryCount || 0
          bVal = b.queryCount || 0
          break
        case 'sentiment':
          aVal = insights[a.id]?.sentiment ?? 0
          bVal = insights[b.id]?.sentiment ?? 0
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [nodes, sortField, sortDirection, filterCategory, insights])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getShapeIcon = (shapeType: string) => {
    // Simple: all topics use circle icon
    return '○'
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-relic-mist">
        <span className="text-xs text-relic-silver font-mono">Filter:</span>
        <button
          onClick={() => setFilterCategory(null)}
          className={`px-2 py-1 text-xs font-mono border border-relic-mist transition-all ${
            filterCategory === null
              ? 'bg-relic-ghost text-relic-slate border-relic-slate'
              : 'bg-relic-white text-relic-silver hover:text-relic-slate'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-2 py-1 text-xs font-mono border border-relic-mist transition-all ${
              filterCategory === cat
                ? 'bg-relic-ghost text-relic-slate border-relic-slate'
                : 'bg-relic-white text-relic-silver hover:text-relic-slate'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs font-mono">
          <thead className="sticky top-0 bg-relic-white border-b border-relic-mist">
            <tr>
              <th className="text-left p-2 text-relic-silver">
                <button
                  onClick={() => handleSort('name')}
                  className="hover:text-relic-slate transition-colors"
                >
                  Topic {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="text-left p-2 text-relic-silver">
                <button
                  onClick={() => handleSort('category')}
                  className="hover:text-relic-slate transition-colors"
                >
                  Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="text-left p-2 text-relic-silver">Shape</th>
              <th className="text-left p-2 text-relic-silver">
                <button
                  onClick={() => handleSort('sentiment')}
                  className="hover:text-relic-slate transition-colors"
                >
                  Sentiment {sortField === 'sentiment' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="text-left p-2 text-relic-silver">Bias</th>
              <th className="text-left p-2 text-relic-silver">Market</th>
              <th className="text-left p-2 text-relic-silver">
                <button
                  onClick={() => handleSort('queryCount')}
                  className="hover:text-relic-slate transition-colors"
                >
                  Queries {sortField === 'queryCount' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredNodes.map(node => {
              const nodeInsights = insights[node.id]
              const shapeConfig = getShapeConfig(node, {
                sentiment: nodeInsights?.sentiment || 0,
                bias: Array.isArray(nodeInsights?.bias) ? nodeInsights.bias.length : (nodeInsights?.bias || 0)
              })
              const isSelected = selectedNode?.id === node.id

              return (
                <tr
                  key={node.id}
                  onClick={() => onNodeSelect(node)}
                  className={`
                    border-b border-relic-mist/50 cursor-pointer transition-colors
                    ${isSelected 
                      ? 'bg-relic-ghost' 
                      : 'hover:bg-relic-ghost/50'
                    }
                  `}
                >
                  <td className="p-2 text-relic-slate">{node.name}</td>
                  <td className="p-2 text-relic-silver">{node.category || 'other'}</td>
                  <td className="p-2">
                    <span className="text-relic-slate" style={{ color: shapeConfig.color }}>
                      {getShapeIcon(shapeConfig.type)}
                    </span>
                  </td>
                  <td className="p-2">
                    {nodeInsights ? (
                      <span className={`text-xs ${
                        nodeInsights.sentiment > 0.3 ? 'text-relic-silver' :
                        nodeInsights.sentiment < -0.3 ? 'text-relic-void' :
                        'text-relic-slate'
                      }`}>
                        {nodeInsights.sentiment > 0 ? '+' : ''}{(nodeInsights.sentiment * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-relic-silver">—</span>
                    )}
                  </td>
                  <td className="p-2">
                    {nodeInsights && nodeInsights.bias.length > 0 ? (
                      <span className="text-xs text-relic-slate">
                        {nodeInsights.bias.join(', ')}
                      </span>
                    ) : (
                      <span className="text-relic-silver">—</span>
                    )}
                  </td>
                  <td className="p-2">
                    {nodeInsights?.marketCorrelation !== null && nodeInsights?.marketCorrelation !== undefined ? (
                      <span className="text-xs text-relic-slate">
                        {(nodeInsights.marketCorrelation * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-relic-silver">—</span>
                    )}
                  </td>
                  <td className="p-2 text-relic-slate">{node.queryCount || 0}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

