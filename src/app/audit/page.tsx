'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  userId: string;
  user: { email: string };
  action: string;
  targetType: string;
  targetId: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
}

type ViewMode = 'logs' | 'summary' | 'activity';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('logs');
  const [filters, setFilters] = useState({
    action: '',
    targetType: '',
    from: '',
    to: '',
  });
  const [summary, setSummary] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  const limit = 20;

  useEffect(() => {
    if (viewMode === 'logs') {
      loadLogs();
    } else if (viewMode === 'summary') {
      loadSummary();
    } else if (viewMode === 'activity') {
      loadActivity();
    }
  }, [page, filters, viewMode]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit,
        offset: (page - 1) * limit,
      };

      if (filters.action) {
        params.action = [filters.action];
      }
      if (filters.targetType) {
        params.targetType = filters.targetType;
      }
      if (filters.from) {
        params.from = new Date(filters.from);
      }
      if (filters.to) {
        params.to = new Date(filters.to);
      }

      const result = await api.audit.getLogs(params);
      setLogs(result.logs);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.from) {
        params.from = new Date(filters.from);
      }
      if (filters.to) {
        params.to = new Date(filters.to);
      }

      const result = await api.audit.getActionSummary(params);
      setSummary(result);
    } catch (error) {
      console.error('Failed to load action summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.from) {
        params.from = new Date(filters.from);
      }
      if (filters.to) {
        params.to = new Date(filters.to);
      }

      const result = await api.audit.getUserActivity(params);
      setActivity(result);
    } catch (error) {
      console.error('Failed to load user activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChanges = (changes: Record<string, any>) => {
    return Object.entries(changes).map(([field, change]) => (
      <div key={field}>
        {field}: {change.from || '(空)'} → {change.to || '(空)'}
      </div>
    ));
  };

  const formatAction = (action: string) => {
    const actionLabels: Record<string, string> = {
      UPDATE_INCIDENT: 'インシデント更新',
      CREATE_RULE: 'ルール作成',
      UPDATE_RULE: 'ルール更新',
      DELETE_RULE: 'ルール削除',
      DELETE_CHANNEL: 'チャンネル削除',
      CREATE_CHANNEL: 'チャンネル追加',
    };
    return actionLabels[action] || action;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">監査ログ</h1>

      {/* ビューモード切り替え */}
      <div className="border-b">
        <div className="flex space-x-6">
          <button
            onClick={() => setViewMode('logs')}
            className={`pb-2 px-1 ${
              viewMode === 'logs' 
                ? 'border-b-2 border-blue-600 font-semibold' 
                : ''
            }`}
          >
            ログ一覧
          </button>
          <button
            onClick={() => setViewMode('summary')}
            className={`pb-2 px-1 ${
              viewMode === 'summary' 
                ? 'border-b-2 border-blue-600 font-semibold' 
                : ''
            }`}
          >
            サマリー
          </button>
          <button
            onClick={() => setViewMode('activity')}
            className={`pb-2 px-1 ${
              viewMode === 'activity' 
                ? 'border-b-2 border-blue-600 font-semibold' 
                : ''
            }`}
          >
            ユーザー活動
          </button>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="action-filter" className="block text-sm font-medium mb-1">
              アクション
            </label>
            <select
              id="action-filter"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">全て</option>
              <option value="UPDATE_INCIDENT">インシデント更新</option>
              <option value="CREATE_RULE">ルール作成</option>
              <option value="UPDATE_RULE">ルール更新</option>
              <option value="DELETE_RULE">ルール削除</option>
              <option value="DELETE_CHANNEL">チャンネル削除</option>
            </select>
          </div>

          <div>
            <label htmlFor="targetType-filter" className="block text-sm font-medium mb-1">
              対象タイプ
            </label>
            <select
              id="targetType-filter"
              value={filters.targetType}
              onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">全て</option>
              <option value="incident">インシデント</option>
              <option value="rule">ルール</option>
              <option value="channel">チャンネル</option>
            </select>
          </div>

          <div>
            <label htmlFor="from-date" className="block text-sm font-medium mb-1">
              開始日
            </label>
            <input
              id="from-date"
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="to-date" className="block text-sm font-medium mb-1">
              終了日
            </label>
            <input
              id="to-date"
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      {loading ? (
        <div className="text-center py-8" aria-live="polite" aria-busy="true">
          読み込み中...
        </div>
      ) : viewMode === 'logs' ? (
        <>
          {/* ログ一覧 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    対象
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    詳細
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(log.createdAt), 'yyyy/MM/dd HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAction(log.action)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.targetType}/{log.targetId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.metadata?.incidentTitle && (
                        <div>{log.metadata.incidentTitle}</div>
                      )}
                      {log.metadata?.ruleName && (
                        <div>{log.metadata.ruleName}</div>
                      )}
                      {log.changes && (
                        <div className="text-xs text-gray-600">
                          {formatChanges(log.changes)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      ) : viewMode === 'summary' ? (
        /* アクションサマリー */
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            {summary.map((item) => (
              <div key={item.action} className="flex justify-between">
                <span>{formatAction(item.action)}</span>
                <span className="font-semibold">{item.count}回</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ユーザー活動 */
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            {activity.map((user) => (
              <div key={user.userId} className="flex justify-between">
                <span>{user.email}</span>
                <span className="font-semibold">{user.actionCount}回</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
