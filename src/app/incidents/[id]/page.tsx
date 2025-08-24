'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { api } from '@/lib/api/client';
import PriorityBadge from '@/components/PriorityBadge';
import IncidentTypeBadge from '@/components/IncidentTypeBadge';
import IncidentStatusBadge from '@/components/IncidentStatusBadge';

interface IncidentDetail {
  incident: {
    id: string;
    title: string;
    description?: string;
    urgency: 'high' | 'medium' | 'low' | null;
    impact: 'high' | 'medium' | 'low' | null;
    urgencyManual: boolean;
    impactManual: boolean;
    type: '障害' | '不具合' | null;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    assignee?: string | null;
    notes?: string | null;
    createdAt: Date;
    channel: {
      name: string;
    };
    message: {
      raw: any;
    };
  };
  slackUrl: string;
  threadMessages: Array<{
    raw: any;
  }>;
}

interface HistoryItem {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  changedAt: Date;
}

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const [detail, setDetail] = useState<IncidentDetail | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUrgency, setEditingUrgency] = useState(false);
  const [editingImpact, setEditingImpact] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [detailData, historyData] = await Promise.all([
          api.incidents.getDetail(params.id),
          api.incidents.getHistory(params.id),
        ]);
        setDetail(detailData);
        setHistory(historyData);
      } catch (error) {
        console.error('Failed to load incident detail:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [params.id]);



  const updateField = async (field: string, value: any) => {
    try {
      await api.incidents.updateDetail(params.id, { [field]: value });
      setStatusMessage(`${field === 'status' ? 'ステータス' : field}が更新されました`);
      setTimeout(() => setStatusMessage(''), 3000);
      
      // データを再読み込み
      const [detailData, historyData] = await Promise.all([
        api.incidents.getDetail(params.id),
        api.incidents.getHistory(params.id),
      ]);
      setDetail(detailData);
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await api.incidents.exportData(params.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incident-${params.id}-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  if (loading) {
    return <div className="p-8">読み込み中...</div>;
  }

  if (!detail) {
    return <div className="p-8">インシデントが見つかりません</div>;
  }

  const { incident } = detail;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">{incident.title}</h1>

      {/* 基本情報 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">基本情報</h2>
        
        {incident.description && (
          <p className="text-gray-700 mb-4">{incident.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* 緊急度 */}
          <div className="flex items-center gap-2">
            <span className="font-medium">緊急度:</span>
            {editingUrgency ? (
              <>
                <select
                  aria-label="緊急度"
                  value={incident.urgency || ''}
                  onChange={() => {}}
                  className="border rounded px-2 py-1"
                >
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
                <button
                  onClick={() => {
                    const select = document.querySelector('[aria-label="緊急度"]') as HTMLSelectElement;
                    updateField('urgency', select.value);
                    setEditingUrgency(false);
                  }}
                  className="text-blue-600"
                >
                  保存
                </button>
                <button
                  onClick={() => setEditingUrgency(false)}
                  className="text-gray-600 ml-2"
                >
                  キャンセル
                </button>
              </>
            ) : (
              <>
                {incident.urgency && <PriorityBadge level={incident.urgency} />}
                <span className="text-gray-700">
                  {incident.urgency === 'high' ? '高' : 
                   incident.urgency === 'medium' ? '中' : 
                   incident.urgency === 'low' ? '低' : '未設定'}
                </span>
                {incident.urgencyManual && (
                  <span className="text-sm text-gray-500">手動設定</span>
                )}
                <button
                  onClick={() => setEditingUrgency(true)}
                  className="text-blue-600 text-sm ml-2"
                >
                  緊急度を編集
                </button>
              </>
            )}
          </div>

          {/* 影響度 */}
          <div className="flex items-center gap-2">
            <span className="font-medium">影響度:</span>
            {editingImpact ? (
              <>
                <select
                  aria-label="影響度"
                  value={incident.impact || ''}
                  onChange={() => {}}
                  className="border rounded px-2 py-1"
                >
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
                <button
                  onClick={() => {
                    const select = document.querySelector('[aria-label="影響度"]') as HTMLSelectElement;
                    updateField('impact', select.value);
                    setEditingImpact(false);
                  }}
                  className="text-blue-600"
                >
                  保存
                </button>
                <button
                  onClick={() => setEditingImpact(false)}
                  className="text-gray-600 ml-2"
                >
                  キャンセル
                </button>
              </>
            ) : (
              <>
                {incident.impact && <PriorityBadge level={incident.impact} />}
                <span className="text-gray-700">
                  {incident.impact === 'high' ? '高' : 
                   incident.impact === 'medium' ? '中' : 
                   incident.impact === 'low' ? '低' : '未設定'}
                </span>
                {incident.impactManual && (
                  <span className="text-sm text-gray-500">手動設定</span>
                )}
                <button
                  onClick={() => setEditingImpact(true)}
                  className="text-blue-600 text-sm ml-2"
                >
                  影響度を編集
                </button>
              </>
            )}
          </div>

          {/* タイプ */}
          <div className="flex items-center gap-2">
            <span className="font-medium">タイプ:</span>
            {incident.type && <IncidentTypeBadge type={incident.type} />}
            <span className="text-gray-700">{incident.type || '未設定'}</span>
          </div>

          {/* ステータス */}
          <div className="flex items-center gap-2">
            <span className="font-medium">ステータス:</span>
            <IncidentStatusBadge status={incident.status} />
            <span className="text-gray-700">{incident.status}</span>
            <select
              aria-label="ステータス変更"
              value={incident.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="ml-2 border rounded px-2 py-1"
            >
              <option value="open">open</option>
              <option value="in_progress">in_progress</option>
              <option value="resolved">resolved</option>
              <option value="closed">closed</option>
            </select>
          </div>
        </div>

        {/* 担当者 */}
        <div className="mt-4">
          <label htmlFor="assignee" className="block font-medium mb-2">
            担当者: {incident.assignee || '未割当'}
          </label>
          <input
            id="assignee"
            type="text"
            aria-label="担当者"
            value={incident.assignee || ''}
            onChange={(e) => setDetail(prev => prev ? {...prev, incident: {...prev.incident, assignee: e.target.value}} : null)}
            onBlur={(e) => updateField('assignee', e.target.value)}
            placeholder="メールアドレスを入力"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* メモ */}
        <div className="mt-4">
          <label htmlFor="notes" className="block font-medium mb-2">
            メモ
          </label>
          <textarea
            id="notes"
            aria-label="メモ"
            value={incident.notes || ''}
            onChange={(e) => setDetail(prev => prev ? {...prev, incident: {...prev.incident, notes: e.target.value}} : null)}
            onBlur={(e) => updateField('notes', e.target.value)}
            rows={4}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Slackメッセージ */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">元のSlackメッセージ</h2>
        <div className="bg-gray-50 p-4 rounded mb-4">
          <p className="whitespace-pre-wrap">{incident.message.raw?.text || 'メッセージなし'}</p>
        </div>
        
        <a
          href={detail.slackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Slackで開く
        </a>

        {detail.threadMessages.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mt-6 mb-2">スレッドの返信</h3>
            {detail.threadMessages.map((msg, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded mb-2">
                <p className="whitespace-pre-wrap">{msg.raw?.text || ''}</p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* 更新履歴 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">更新履歴</h2>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((item) => (
              <div key={item.id} className="border-b pb-2">
                <p className="font-medium">
                  {item.field}: {item.oldValue || 'なし'} → {item.newValue || 'なし'}
                </p>
                <p className="text-sm text-gray-600">
                  {item.changedBy} - {format(new Date(item.changedAt), 'yyyy/MM/dd HH:mm')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">履歴はありません</p>
        )}
      </div>

      {/* アクション */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          データをエクスポート
        </button>
      </div>

      {/* ステータスメッセージ */}
      {statusMessage && (
        <div role="status" aria-live="polite" className="sr-only">
          {statusMessage}
        </div>
      )}
    </div>
  );
}
