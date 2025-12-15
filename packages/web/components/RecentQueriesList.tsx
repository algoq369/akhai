'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface QueryItem {
  id: string;
  query: string;
  flow: 'A' | 'B';
  status: 'pending' | 'processing' | 'complete' | 'error';
  timestamp: number;
}

export default function RecentQueriesList() {
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch recent queries from API
    const fetchQueries = () => {
      fetch('/api/stats/recent')
        .then(res => res.json())
        .then(data => {
          setQueries(data.queries || []);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    };

    // Initial fetch
    fetchQueries();

    // Auto-refresh every 3 seconds
    const interval = setInterval(fetchQueries, 3000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        <p className="text-gray-500 mt-2 text-sm">Loading recent queries...</p>
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">No queries yet. Start a new query!</p>
        <Link
          href="/"
          className="inline-block mt-4 px-4 py-2 bg-white text-black text-xs rounded-lg hover:bg-gray-200 transition font-semibold"
        >
          New Query
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config = {
      pending: 'bg-gray-800 text-gray-400 border border-gray-700',
      processing: 'bg-gray-700 text-gray-300 border border-gray-600',
      complete: 'bg-gray-900 text-white border border-gray-700',
      error: 'bg-gray-800 text-gray-500 border border-gray-700',
    };

    return config[status as keyof typeof config] || config.pending;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-2">
      {queries.map(item => (
        <Link
          key={item.id}
          href={`/query/${item.id}`}
          className="block bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition"
        >
          <div className="flex items-start justify-between mb-1.5">
            <p className="text-sm font-medium text-gray-300 line-clamp-1 flex-1">
              {item.query}
            </p>
            <span className={`ml-3 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getStatusBadge(item.status)}`}>
              {item.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <span className="font-medium">Flow {item.flow}</span>
            </span>
            <span>•</span>
            <span>{formatTimestamp(item.timestamp)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
