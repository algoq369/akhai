'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LiquidEther } from '@/components/ui/LiquidEther';
import { DecryptedTitle } from '@/components/ui/DecryptedText';

interface QueryHistoryItem {
  id: string;
  query: string;
  flow: string;
  status: string;
  created_at: number;
  completed_at: number | null;
  tokens_used: number;
  cost: number;
}

export default function HistoryPage() {
  const [queries, setQueries] = useState<QueryHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'complete' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setQueries(data.queries || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQueries = queries.filter(q => {
    const matchesFilter = filter === 'all' || q.status === filter;
    const matchesSearch = q.query.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatDuration = (start: number, end: number | null) => {
    if (!end) return '-';
    const seconds = end - start;
    return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  if (loading) {
    return (
      <>
        <LiquidEther />
        <div className="min-h-screen pt-16 flex items-center justify-center relative">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <LiquidEther />
      <div className="min-h-screen pt-16 relative">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <DecryptedTitle
                text="Query History"
                className="text-2xl font-bold text-white"
                speed={20}
              />
              <p className="text-xs text-gray-600 mt-1 uppercase tracking-wider">{queries.length} total queries</p>
            </div>
            <Link href="/" className="px-3 py-1.5 text-xs font-medium text-black bg-white rounded-lg hover:bg-gray-200 transition-colors">
              New Query
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              placeholder="Search queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-white/5 border border-gray-800 rounded-lg focus:outline-none focus:border-gray-600 text-white placeholder-gray-600"
            />
            <div className="flex gap-2">
              {(['all', 'complete', 'error'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium ${filter === f ? 'bg-white text-black' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800'}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

        {filteredQueries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No queries found</p>
          </div>
        ) : (
          <div className="border border-gray-800 rounded-lg overflow-x-auto bg-gray-900/50 backdrop-blur-sm">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Flow</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredQueries.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-300 truncate max-w-[200px]" title={q.query}>{q.query}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded">Flow {q.flow}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${q.status === 'complete' ? 'bg-gray-900 text-white border border-gray-700' : q.status === 'error' ? 'bg-gray-800 text-gray-500 border border-gray-700' : 'bg-gray-700 text-gray-400 border border-gray-600'}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{q.tokens_used?.toLocaleString() || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">${q.cost?.toFixed(4) || '0.00'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{formatDate(q.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/query/${q.id}`} className="text-xs text-gray-300 hover:text-white">View</Link>
                        <a href={`/api/export/${q.id}?format=md`} target="_blank" className="text-xs text-gray-500 hover:text-gray-400">Export</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
