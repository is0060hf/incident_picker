import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '../src/app/dashboard/page';

// APIモック
vi.mock('../src/lib/api/client', () => ({
  api: {
    dashboard: {
      getSummary: vi.fn(),
      getDistribution: vi.fn(),
      getTrends: vi.fn(),
      getRecentIncidents: vi.fn(),
      getChannelStats: vi.fn(),
    },
  },
}));

const mockApi = vi.mocked((await import('../src/lib/api/client')).api);

describe('Dashboard UI (Red phase)', () => {
  const mockSummary = {
    total: 50,
    open: 20,
    inProgress: 10,
    resolved: 15,
    closed: 5,
    byType: {
      障害: 30,
      不具合: 20,
    },
  };

  const mockDistribution = {
    urgency: {
      high: 15,
      medium: 20,
      low: 10,
      null: 5,
    },
    impact: {
      high: 20,
      medium: 15,
      low: 10,
      null: 5,
    },
    matrix: {
      'high-high': 10,
      'high-medium': 3,
      'high-low': 2,
      'medium-high': 5,
      'medium-medium': 10,
      'medium-low': 5,
      'low-high': 5,
      'low-medium': 2,
      'low-low': 3,
    },
  };

  const mockTrends = {
    daily: [
      { date: '2024-01-01', total: 5, 障害: 3, 不具合: 2 },
      { date: '2024-01-02', total: 3, 障害: 1, 不具合: 2 },
      { date: '2024-01-03', total: 7, 障害: 4, 不具合: 3 },
    ],
  };

  const mockRecentIncidents = [
    {
      id: '1',
      title: 'Database error',
      type: '障害',
      urgency: 'high',
      impact: 'high',
      status: 'open',
      createdAt: new Date('2024-01-03T10:00:00Z'),
      channel: { name: 'incidents' },
    },
    {
      id: '2',
      title: 'UI bug',
      type: '不具合',
      urgency: 'low',
      impact: 'low',
      status: 'resolved',
      createdAt: new Date('2024-01-03T09:00:00Z'),
      channel: { name: 'bugs' },
    },
  ];

  const mockChannelStats = [
    { channelId: 'ch1', channelName: 'incidents', count: 30 },
    { channelId: 'ch2', channelName: 'alerts', count: 15 },
    { channelId: 'ch3', channelName: 'bugs', count: 5 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.dashboard.getSummary.mockResolvedValue(mockSummary);
    mockApi.dashboard.getDistribution.mockResolvedValue(mockDistribution);
    mockApi.dashboard.getTrends.mockResolvedValue(mockTrends);
    mockApi.dashboard.getRecentIncidents.mockResolvedValue(mockRecentIncidents);
    mockApi.dashboard.getChannelStats.mockResolvedValue(mockChannelStats);
  });

  describe('Summary Display', () => {
    it('displays incident summary statistics', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('インシデント サマリー')).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument(); // 合計
        expect(screen.getByText('20')).toBeInTheDocument(); // オープン
        expect(screen.getByText('10')).toBeInTheDocument(); // 対応中
        expect(screen.getByText('15')).toBeInTheDocument(); // 解決済み
        expect(screen.getByText('5')).toBeInTheDocument(); // クローズ
      });
    });

    it('displays incident type breakdown', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('タイプ別')).toBeInTheDocument();
        expect(screen.getByText('障害: 30')).toBeInTheDocument();
        expect(screen.getByText('不具合: 20')).toBeInTheDocument();
      });
    });
  });

  describe('Distribution Display', () => {
    it('displays urgency distribution', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('緊急度分布')).toBeInTheDocument();
      });

      // 分布の値を確認（複数の高:があるため、getAllByTextを使用）
      const highLabels = screen.getAllByText(/高:/);
      expect(highLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('15')).toBeInTheDocument();
      
      const mediumLabels = screen.getAllByText(/中:/);
      expect(mediumLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('20')).toBeInTheDocument();
      
      const lowLabels = screen.getAllByText(/低:/);
      expect(lowLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('displays impact distribution', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('影響度分布')).toBeInTheDocument();
      });

      // 分布の値を確認（複数の要素があるため、getAllByTextを使用）
      expect(screen.getAllByText(/高:/).length).toBeGreaterThan(0);
      expect(screen.getAllByText('20').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/中:/).length).toBeGreaterThan(0);
      expect(screen.getAllByText('15').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/低:/).length).toBeGreaterThan(0);
      expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    });
  });

  describe('Trends Display', () => {
    it('displays trend chart', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('インシデント推移')).toBeInTheDocument();
        expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
      });
    });

    it('displays period selector', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('期間選択')).toBeInTheDocument();
        expect(screen.getByText('過去7日間')).toBeInTheDocument();
        expect(screen.getByText('過去30日間')).toBeInTheDocument();
        expect(screen.getByText('過去90日間')).toBeInTheDocument();
      });
    });
  });

  describe('Recent Incidents', () => {
    it('displays recent incidents list', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('最近のインシデント')).toBeInTheDocument();
        expect(screen.getByText('Database error')).toBeInTheDocument();
        expect(screen.getByText('UI bug')).toBeInTheDocument();
      });
    });

    it('displays incident details in list', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        // インシデントのタイトルが表示されるまで待つ
        expect(screen.getByText('Database error')).toBeInTheDocument();
        expect(screen.getByText('UI bug')).toBeInTheDocument();
      });

      // 最低限の確認のみ実施
      expect(mockApi.dashboard.getRecentIncidents).toHaveBeenCalled();
    });
  });

  describe('Channel Statistics', () => {
    it('displays channel statistics', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('チャンネル別統計')).toBeInTheDocument();
        expect(screen.getByText('incidents: 30件')).toBeInTheDocument();
        expect(screen.getByText('alerts: 15件')).toBeInTheDocument();
        expect(screen.getByText('bugs: 5件')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('ダッシュボード');
        const h2s = screen.getAllByRole('heading', { level: 2 });
        expect(h2s.length).toBeGreaterThan(0);
      });
    });

    it('has proper ARIA labels', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('期間選択')).toBeInTheDocument();
        expect(screen.getByRole('region', { name: 'インシデント サマリー' })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: '最近のインシデント' })).toBeInTheDocument();
      });
    });
  });
});
