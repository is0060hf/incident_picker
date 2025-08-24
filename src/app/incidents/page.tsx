'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Incident {
  id: string;
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  type: '障害' | '不具合';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  channel?: { name: string };
  message?: { slackTs: string };
}

interface FilterState {
  q?: string;
  urgency?: string[];
  impact?: string[];
  type?: '障害' | '不具合';
  status?: string[];
  from?: Date;
  to?: Date;
}

const statusLabels = {
  open: '未対応',
  in_progress: '対応中',
  resolved: '解決済み',
  closed: 'クローズ',
};

const urgencyLabels = {
  high: '高',
  medium: '中',
  low: '低',
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    loadIncidents();
  }, [page, filters]);

  const loadIncidents = async () => {
    const params = {
      page,
      q: filters.q,
      urgency: filters.urgency,
      impact: filters.impact,
      type: filters.type,
      status: filters.status,
      from: filters.from,
      to: filters.to,
    };

    const result = await api.incidents.list(params);
    setIncidents(result.incidents);
    setTotalPages(result.totalPages);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, q: searchQuery });
    setPage(1);
  };

  const handleFilterApply = () => {
    setPage(1);
    loadIncidents();
    setShowFilters(false);
  };

  const handleUrgencyChange = (value: string, checked: boolean) => {
    const current = filters.urgency || [];
    if (checked) {
      setFilters({ ...filters, urgency: [...current, value] });
    } else {
      setFilters({ ...filters, urgency: current.filter(v => v !== value) });
    }
  };

  const loadIncidentDetails = async (incident: Incident) => {
    const details = await api.incidents.get(incident.id);
    setSelectedIncident(details);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">インシデント一覧</h2>

      {/* 検索バー */}
      <form onSubmit={handleSearch} className="flex gap-4">
        <input
          type="text"
          placeholder="インシデントを検索"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border rounded px-4 py-2"
        />
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="border rounded px-4 py-2"
        >
          フィルタ
        </button>
      </form>

      {/* フィルタパネル */}
      {showFilters && (
        <div className="bg-white p-6 rounded shadow space-y-4">
          <div>
            <div className="block mb-2" id="urgency-label">緊急度</div>
            <div className="flex gap-4" role="group" aria-labelledby="urgency-label">
              <label>
                <input
                  type="checkbox"
                  checked={filters.urgency?.includes('high') || false}
                  onChange={(e) => handleUrgencyChange('high', e.target.checked)}
                />
                高
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.urgency?.includes('medium') || false}
                  onChange={(e) => handleUrgencyChange('medium', e.target.checked)}
                />
                中
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.urgency?.includes('low') || false}
                  onChange={(e) => handleUrgencyChange('low', e.target.checked)}
                />
                低
              </label>
            </div>
          </div>

          <div>
            <label id="impact-label">影響度</label>
            <div role="group" aria-labelledby="impact-label">{/* 実装省略 */}</div>
          </div>

          <div>
            <label htmlFor="type-select">タイプ</label>
            <select
              id="type-select"
              value={filters.type || ''}
              onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">すべて</option>
              <option value="障害">障害</option>
              <option value="不具合">不具合</option>
            </select>
          </div>

          <div>
            <label id="status-label">ステータス</label>
            <div role="group" aria-labelledby="status-label">{/* 実装省略 */}</div>
          </div>

          <div>
            <label id="period-label">期間</label>
            <div role="group" aria-labelledby="period-label">{/* 実装省略 */}</div>
          </div>

          <button
            onClick={handleFilterApply}
            className="bg-primary text-white px-4 py-2 rounded"
          >
            適用
          </button>
        </div>
      )}

      {/* インシデントテーブル */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table 
          className="w-full"
          role="table"
          aria-label="インシデント一覧"
        >
          <thead>
            <tr className="border-b bg-gray-50">
              <th scope="col" className="p-4 text-left">タイトル</th>
              <th scope="col" className="p-4 text-left">緊急度</th>
              <th scope="col" className="p-4 text-left">影響度</th>
              <th scope="col" className="p-4 text-left">タイプ</th>
              <th scope="col" className="p-4 text-left">ステータス</th>
              <th scope="col" className="p-4 text-left">作成日時</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr
                key={incident.id}
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => loadIncidentDetails(incident)}
              >
                <td className="p-4">{incident.title}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    incident.urgency === 'high' ? 'bg-red-100 text-red-700' :
                    incident.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {urgencyLabels[incident.urgency]}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    incident.impact === 'high' ? 'bg-red-100 text-red-700' :
                    incident.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {urgencyLabels[incident.impact]}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    incident.type === '障害' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {incident.type}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    incident.status === 'open' ? 'bg-blue-100 text-blue-700' :
                    incident.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                    incident.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {statusLabels[incident.status]}
                  </span>
                </td>
                <td className="p-4">
                  {incident.createdAt ? format(new Date(incident.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja }) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      <div className="flex justify-center items-center gap-4">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-4 py-2 border rounded disabled:opacity-50"
          aria-label="前のページ"
        >
          前へ
        </button>
        <span>{page} / {totalPages}</span>
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 border rounded disabled:opacity-50"
          aria-label="次のページ"
        >
          次へ
        </button>
      </div>

      {/* 詳細モーダル */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">インシデント詳細</h3>
            <dl className="space-y-2">
              <div>
                <dt className="font-bold">タイトル</dt>
                <dd>{selectedIncident.title}</dd>
              </div>
              <div>
                <dt className="font-bold">説明</dt>
                <dd>{selectedIncident.description}</dd>
              </div>
              <div>
                <dt className="font-bold">チャンネル</dt>
                <dd>チャンネル: {selectedIncident.channel?.name}</dd>
              </div>
            </dl>
            <button
              onClick={() => setSelectedIncident(null)}
              className="mt-4 px-4 py-2 border rounded"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
