'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { format } from 'date-fns';
import Link from 'next/link';
import IncidentTypeBadge from '@/components/IncidentTypeBadge';
import IncidentStatusBadge from '@/components/IncidentStatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import debounce from 'lodash/debounce';

interface SearchFilters {
  urgency: string;
  impact: string;
  type: string;
  status: string;
  channelId: string;
}

interface SearchSuggestion {
  term: string;
  count: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>({
    urgency: '',
    impact: '',
    type: '',
    status: '',
    channelId: '',
  });
  const [channels, setChannels] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const limit = 20;

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const data = await api.channels.list();
      setChannels(data);
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  const performSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setShowSuggestions(false);

    try {
      const searchFilters: any = {
        limit,
        offset: (page - 1) * limit,
      };

      if (filters.urgency) {
        searchFilters.urgency = [filters.urgency];
      }
      if (filters.impact) {
        searchFilters.impact = [filters.impact];
      }
      if (filters.type) {
        searchFilters.type = filters.type;
      }
      if (filters.status) {
        searchFilters.status = [filters.status];
      }
      if (filters.channelId) {
        searchFilters.channelId = filters.channelId;
      }

      const result = await api.search.searchIncidents(query, searchFilters);
      setResults(result.incidents);
      setTotal(result.total);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        const data = await api.search.getSuggestions(searchQuery);
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Failed to load suggestions:', error);
      }
    }, 300),
    []
  );

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    loadSuggestions(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    performSearch();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">検索</h1>

      {/* 検索フォーム */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          {/* 検索入力 */}
          <div className="relative">
            <label htmlFor="search-input" className="sr-only">
              検索キーワード
            </label>
            <div className="flex gap-2">
              <input
                id="search-input"
                type="text"
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="インシデントを検索..."
                className="flex-1 border rounded px-4 py-2"
              />
              <button
                onClick={performSearch}
                disabled={!query.trim() || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                検索
              </button>
            </div>

            {/* 検索候補 */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.term}
                    onClick={() => handleSuggestionClick(suggestion.term)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    {suggestion.term} ({suggestion.count})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* フィルター */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label htmlFor="urgency-filter" className="block text-sm font-medium mb-1">
                緊急度
              </label>
              <select
                id="urgency-filter"
                value={filters.urgency}
                onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">全て</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>

            <div>
              <label htmlFor="impact-filter" className="block text-sm font-medium mb-1">
                影響度
              </label>
              <select
                id="impact-filter"
                value={filters.impact}
                onChange={(e) => setFilters({ ...filters, impact: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">全て</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>

            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium mb-1">
                タイプ
              </label>
              <select
                id="type-filter"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">全て</option>
                <option value="障害">障害</option>
                <option value="不具合">不具合</option>
              </select>
            </div>

            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium mb-1">
                ステータス
              </label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">全て</option>
                <option value="open">オープン</option>
                <option value="in_progress">対応中</option>
                <option value="resolved">解決済み</option>
                <option value="closed">クローズ</option>
              </select>
            </div>

            <div>
              <label htmlFor="channel-filter" className="block text-sm font-medium mb-1">
                チャンネル
              </label>
              <select
                id="channel-filter"
                value={filters.channelId}
                onChange={(e) => setFilters({ ...filters, channelId: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">全て</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 検索結果 */}
      {loading ? (
        <div className="text-center py-8">検索中...</div>
      ) : results.length > 0 ? (
        <>
          <div className="text-gray-600" role="status" aria-live="polite">
            {total}件の結果{total > 0 && 'が見つかりました'}
          </div>

          <div className="space-y-4">
            {results.map((incident) => (
              <Link
                key={incident.id}
                href={`/incidents/${incident.id}`}
                className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{incident.title}</h3>
                  <div className="flex gap-2">
                    <IncidentTypeBadge type={incident.type} />
                    <IncidentStatusBadge status={incident.status} />
                  </div>
                </div>

                {incident.description && (
                  <p className="text-gray-600 mb-3">{incident.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{incident.channel.name}</span>
                  <span>{format(new Date(incident.createdAt), 'yyyy/MM/dd HH:mm')}</span>
                  {incident.urgency && <PriorityBadge level={incident.urgency} />}
                  {incident.impact && <PriorityBadge level={incident.impact} />}
                  {incident.searchRank !== undefined && (
                    <span className="ml-auto">
                      関連度: {Math.round(incident.searchRank * 100)}%
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                前へ
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                次へ
              </button>
            </div>
          )}
        </>
      ) : query && !loading ? (
        <div className="text-center py-8 text-gray-500">
          検索結果が見つかりませんでした
        </div>
      ) : null}
    </div>
  );
}
