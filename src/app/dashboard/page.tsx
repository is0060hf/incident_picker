'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { format, subDays } from 'date-fns';
import IncidentStatusBadge from '@/components/IncidentStatusBadge';
import IncidentTypeBadge from '@/components/IncidentTypeBadge';
import PriorityBadge from '@/components/PriorityBadge';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [distribution, setDistribution] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
  const [channelStats, setChannelStats] = useState<any[]>([]);
  const [period, setPeriod] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      const to = new Date();
      const from = subDays(to, period);

      const [summaryData, distributionData, trendsData, recentData, channelData] = await Promise.all([
        api.dashboard.getSummary(),
        api.dashboard.getDistribution(),
        api.dashboard.getTrends(from, to),
        api.dashboard.getRecentIncidents(5),
        api.dashboard.getChannelStats(),
      ]);

      setSummary(summaryData);
      setDistribution(distributionData);
      setTrends(trendsData);
      setRecentIncidents(recentData);
      setChannelStats(channelData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8" aria-live="polite" aria-busy="true">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ダッシュボード</h1>

      {/* サマリー */}
      <section aria-label="インシデント サマリー" className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">インシデント サマリー</h2>
        
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold">{summary?.total || 0}</div>
            <div className="text-gray-600">合計</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{summary?.open || 0}</div>
            <div className="text-gray-600">オープン</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{summary?.inProgress || 0}</div>
            <div className="text-gray-600">対応中</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{summary?.resolved || 0}</div>
            <div className="text-gray-600">解決済み</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">{summary?.closed || 0}</div>
            <div className="text-gray-600">クローズ</div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">タイプ別</h3>
          <div className="space-y-1">
            <div>障害: {summary?.byType?.障害 || 0}</div>
            <div>不具合: {summary?.byType?.不具合 || 0}</div>
          </div>
        </div>
      </section>

      {/* 分布 */}
      <div className="grid grid-cols-2 gap-6">
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">緊急度分布</h2>
          <div className="space-y-2">
            <div>高: {distribution?.urgency?.high || 0}</div>
            <div>中: {distribution?.urgency?.medium || 0}</div>
            <div>低: {distribution?.urgency?.low || 0}</div>
            <div className="text-gray-500">未設定: {distribution?.urgency?.null || 0}</div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">影響度分布</h2>
          <div className="space-y-2">
            <div>高: {distribution?.impact?.high || 0}</div>
            <div>中: {distribution?.impact?.medium || 0}</div>
            <div>低: {distribution?.impact?.low || 0}</div>
            <div className="text-gray-500">未設定: {distribution?.impact?.null || 0}</div>
          </div>
        </section>
      </div>

      {/* トレンド */}
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">インシデント推移</h2>
          <div>
            <label htmlFor="period-select" className="sr-only">期間選択</label>
            <select
              id="period-select"
              aria-label="期間選択"
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="border rounded px-3 py-1"
            >
              <option value={7}>過去7日間</option>
              <option value={30}>過去30日間</option>
              <option value={90}>過去90日間</option>
            </select>
          </div>
        </div>
        
        {/* 簡易的なチャート表示 */}
        <div data-testid="trend-chart" className="h-64 bg-gray-50 rounded flex items-center justify-center">
          <div className="text-gray-500">
            {trends?.daily ? (
              <div className="space-y-2">
                {trends.daily.map((day: any) => (
                  <div key={day.date} className="text-sm">
                    {day.date}: 合計 {day.total} (障害 {day.障害}, 不具合 {day.不具合})
                  </div>
                ))}
              </div>
            ) : trends?.weekly ? (
              <div className="space-y-2">
                {trends.weekly.map((week: any) => (
                  <div key={week.week} className="text-sm">
                    週 {week.week}: 合計 {week.total} (障害 {week.障害}, 不具合 {week.不具合})
                  </div>
                ))}
              </div>
            ) : (
              'データなし'
            )}
          </div>
        </div>
      </section>

      {/* 最近のインシデント */}
      <section aria-label="最近のインシデント" className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">最近のインシデント</h2>
        <div className="space-y-3">
          {recentIncidents.map((incident) => (
            <div key={incident.id} className="border-b pb-3 last:border-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{incident.title}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    {incident.channel?.name} • {format(new Date(incident.createdAt), 'yyyy/MM/dd HH:mm')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <IncidentTypeBadge type={incident.type} />
                  <IncidentStatusBadge status={incident.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* チャンネル統計 */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">チャンネル別統計</h2>
        <div className="space-y-2">
          {channelStats.map((stat) => (
            <div key={stat.channelId}>
              {stat.channelName}: {stat.count}件
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
