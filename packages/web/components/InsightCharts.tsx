'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { TopicInsights } from '@/lib/mindmap-insights'

interface InsightChartsProps {
  insights: Record<string, TopicInsights>
}

// Grey color palette for charts
const GREY_COLORS = ['#A3A3A3', '#6B7280', '#525252', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6', '#4B5563']

export default function InsightCharts({ insights }: InsightChartsProps) {
  // Sentiment distribution
  const sentimentData = [
    { name: 'Negative', value: Object.values(insights).filter(i => i.sentiment < -0.3).length, color: '#4B5563' },
    { name: 'Neutral', value: Object.values(insights).filter(i => i.sentiment >= -0.3 && i.sentiment <= 0.3).length, color: '#6B7280' },
    { name: 'Positive', value: Object.values(insights).filter(i => i.sentiment > 0.3).length, color: '#D1D5DB' },
  ]

  // Bias distribution
  const biasCounts: Record<string, number> = {}
  Object.values(insights).forEach(i => {
    i.bias.forEach(b => {
      biasCounts[b] = (biasCounts[b] || 0) + 1
    })
  })
  const biasData = Object.entries(biasCounts).map(([name, value], index) => ({
    name,
    value,
    color: GREY_COLORS[index % GREY_COLORS.length],
  }))

  // Factuality distribution
  const factualityData = [
    { name: 'Fact', value: Object.values(insights).filter(i => i.factuality === 'fact').length, color: '#6B7280' },
    { name: 'Mixed', value: Object.values(insights).filter(i => i.factuality === 'mixed').length, color: '#9CA3AF' },
    { name: 'Opinion', value: Object.values(insights).filter(i => i.factuality === 'opinion').length, color: '#A3A3A3' },
  ]

  return (
    <div className="space-y-6">
      {/* Sentiment Distribution */}
      <div>
        <h4 className="text-xs font-medium text-relic-slate mb-3">Sentiment Distribution</h4>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={sentimentData}>
            <XAxis dataKey="name" tick={{ fill: '#A3A3A3', fontSize: 10 }} />
            <YAxis tick={{ fill: '#A3A3A3', fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FAFAFA',
                border: '1px solid #E5E5E5',
                borderRadius: '4px',
                color: '#525252',
              }}
            />
            <Bar dataKey="value" fill="#6B7280" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bias Distribution */}
      {biasData.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-relic-slate mb-3">Bias Types</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={biasData}>
              <XAxis dataKey="name" tick={{ fill: '#A3A3A3', fontSize: 10 }} />
              <YAxis tick={{ fill: '#A3A3A3', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FAFAFA',
                  border: '1px solid #E5E5E5',
                  borderRadius: '4px',
                  color: '#525252',
                }}
              />
              <Bar dataKey="value" fill="#6B7280" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Factuality Distribution */}
      <div>
        <h4 className="text-xs font-medium text-relic-slate mb-3">Fact vs Opinion</h4>
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={factualityData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={50}
              fill="#8884d8"
              dataKey="value"
            >
              {factualityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#FAFAFA',
                border: '1px solid #E5E5E5',
                borderRadius: '4px',
                color: '#525252',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

