'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';

interface Channel {
  id: string;
  name: string;
}

export default function ReportsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  
  // インシデントレポートのフィルター
  const [incidentFilters, setIncidentFilters] = useState({
    urgency: '',
    impact: '',
    type: '',
    status: '',
    channelId: '',
    from: '',
    to: '',
  });

  // サマリーレポートの期間
  const [summaryPeriod, setSummaryPeriod] = useState({
    from: '',
    to: '',
  });

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

  const downloadIncidentReport = async () => {
    try {
      const filters: any = {};
      
      if (incidentFilters.urgency) {
        filters.urgency = [incidentFilters.urgency];
      }
      if (incidentFilters.impact) {
        filters.impact = [incidentFilters.impact];
      }
      if (incidentFilters.type) {
        filters.type = incidentFilters.type;
      }
      if (incidentFilters.status) {
        filters.status = [incidentFilters.status];
      }
      if (incidentFilters.channelId) {
        filters.channelId = incidentFilters.channelId;
      }
      if (incidentFilters.from) {
        filters.from = incidentFilters.from;
      }
      if (incidentFilters.to) {
        filters.to = incidentFilters.to;
      }

      const blob = await api.reports.downloadIncidentReport(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incident-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const downloadChannelReport = async () => {
    try {
      const blob = await api.reports.downloadChannelReport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `channel-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const downloadSummaryReport = async () => {
    try {
      if (!summaryPeriod.from || !summaryPeriod.to) {
        alert('期間を指定してください');
        return;
      }

      const blob = await api.reports.downloadSummaryReport(
        summaryPeriod.from,
        summaryPeriod.to
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `summary-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">レポート</h1>

      {/* インシデントレポート */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">インシデントレポート</h2>
        
        <div className="mb-6">
          <h3 className="font-medium mb-3">フィルター</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="urgency" className="block text-sm font-medium mb-1">
                緊急度
              </label>
              <select
                id="urgency"
                value={incidentFilters.urgency}
                onChange={(e) => setIncidentFilters({ ...incidentFilters, urgency: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">全て</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>

            <div>
              <label htmlFor="impact" className="block text-sm font-medium mb-1">
                影響度
              </label>
              <select
                id="impact"
                value={incidentFilters.impact}
                onChange={(e) => setIncidentFilters({ ...incidentFilters, impact: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">全て</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-1">
                タイプ
              </label>
              <select
                id="type"
                value={incidentFilters.type}
                onChange={(e) => setIncidentFilters({ ...incidentFilters, type: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">全て</option>
                <option value="障害">障害</option>
                <option value="不具合">不具合</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                ステータス
              </label>
              <select
                id="status"
                value={incidentFilters.status}
                onChange={(e) => setIncidentFilters({ ...incidentFilters, status: e.target.value })}
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
              <label htmlFor="channel" className="block text-sm font-medium mb-1">
                チャンネル
              </label>
              <select
                id="channel"
                value={incidentFilters.channelId}
                onChange={(e) => setIncidentFilters({ ...incidentFilters, channelId: e.target.value })}
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

            <div>
              <label htmlFor="from" className="block text-sm font-medium mb-1">
                開始日
              </label>
              <input
                id="from"
                type="date"
                value={incidentFilters.from}
                onChange={(e) => setIncidentFilters({ ...incidentFilters, from: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="to" className="block text-sm font-medium mb-1">
                終了日
              </label>
              <input
                id="to"
                type="date"
                value={incidentFilters.to}
                onChange={(e) => setIncidentFilters({ ...incidentFilters, to: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        </div>

        <button
          onClick={downloadIncidentReport}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          インシデントレポートをダウンロード
        </button>
      </section>

      {/* チャンネル統計レポート */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">チャンネル統計レポート</h2>
        <p className="text-gray-600 mb-4">
          各チャンネルのインシデント数を集計したレポートです。
        </p>
        <button
          onClick={downloadChannelReport}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          チャンネル統計をダウンロード
        </button>
      </section>

      {/* サマリーレポート */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">サマリーレポート</h2>
        <p className="text-gray-600 mb-4">
          指定期間のインシデント統計サマリーです。
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="summary-from" className="block text-sm font-medium mb-1">
              集計開始日
            </label>
            <input
              id="summary-from"
              type="date"
              value={summaryPeriod.from}
              onChange={(e) => setSummaryPeriod({ ...summaryPeriod, from: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="summary-to" className="block text-sm font-medium mb-1">
              集計終了日
            </label>
            <input
              id="summary-to"
              type="date"
              value={summaryPeriod.to}
              onChange={(e) => setSummaryPeriod({ ...summaryPeriod, to: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <button
          onClick={downloadSummaryReport}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          サマリーレポートをダウンロード
        </button>
      </section>
    </div>
  );
}
