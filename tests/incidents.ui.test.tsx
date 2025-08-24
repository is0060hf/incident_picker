import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IncidentsPage from '../src/app/incidents/page';

// APIモック
vi.mock('../src/lib/api/client', () => ({
  api: {
    incidents: {
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { api } from '../src/lib/api/client';

describe('Incidents List UI (Red phase)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays incidents list with pagination', async () => {
    const mockResponse = {
      incidents: [
        {
          id: '1',
          title: 'Production outage',
          description: 'System is down',
          urgency: 'high',
          impact: 'high',
          type: '障害',
          status: 'open',
          createdAt: new Date('2024-01-01'),
          channel: { name: 'general' },
        },
        {
          id: '2',
          title: 'Slow response time',
          description: 'API response is slow',
          urgency: 'medium',
          impact: 'medium',
          type: '障害',
          status: 'in_progress',
          createdAt: new Date('2024-01-02'),
          channel: { name: 'alerts' },
        },
      ],
      total: 10,
      page: 1,
      totalPages: 5,
    };

    (api.incidents.list as any).mockResolvedValue(mockResponse);

    render(<IncidentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Production outage')).toBeInTheDocument();
      expect(screen.getByText('Slow response time')).toBeInTheDocument();
    });

    // ステータスバッジ
    expect(screen.getByText('未対応')).toBeInTheDocument();
    expect(screen.getByText('対応中')).toBeInTheDocument();

    // タイプバッジ
    expect(screen.getAllByText('障害')).toHaveLength(2);

    // ページネーション
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });

  it('provides filter controls', async () => {
    (api.incidents.list as any).mockResolvedValue({
      incidents: [],
      total: 0,
      page: 1,
      totalPages: 1,
    });

    render(<IncidentsPage />);

    // 検索ボックス
    expect(screen.getByPlaceholderText('インシデントを検索')).toBeInTheDocument();

    // フィルタボタン
    expect(screen.getByText('フィルタ')).toBeInTheDocument();

    // フィルタを開く
    await userEvent.click(screen.getByText('フィルタ'));

    // フィルタオプション
    expect(screen.getByLabelText('緊急度')).toBeInTheDocument();
    expect(screen.getByLabelText('影響度')).toBeInTheDocument();
    expect(screen.getByLabelText('タイプ')).toBeInTheDocument();
    expect(screen.getByLabelText('ステータス')).toBeInTheDocument();
    expect(screen.getByLabelText('期間')).toBeInTheDocument();
  });

  it('searches incidents by query', async () => {
    (api.incidents.list as any).mockResolvedValue({
      incidents: [],
      total: 0,
      page: 1,
      totalPages: 1,
    });

    const user = userEvent.setup();
    render(<IncidentsPage />);

    const searchBox = screen.getByPlaceholderText('インシデントを検索');
    await user.type(searchBox, 'production');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(api.incidents.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'production',
          page: 1,
        })
      );
    });
  });

  it('applies multiple filters', async () => {
    (api.incidents.list as any).mockResolvedValue({
      incidents: [],
      total: 0,
      page: 1,
      totalPages: 1,
    });

    const user = userEvent.setup();
    render(<IncidentsPage />);

    // フィルタを開く
    await user.click(screen.getByText('フィルタ'));

    // 緊急度フィルタ
    await user.click(screen.getByLabelText('高'));
    await user.click(screen.getByLabelText('中'));

    // タイプフィルタ
    await user.selectOptions(screen.getByLabelText('タイプ'), '障害');

    // 適用
    await user.click(screen.getByText('適用'));

    await waitFor(() => {
      expect(api.incidents.list).toHaveBeenCalledWith(
        expect.objectContaining({
          urgency: ['high', 'medium'],
          type: '障害',
          page: 1,
        })
      );
    });
  });

  it('navigates through pages', async () => {
    const page1 = {
      incidents: [{ id: '1', title: 'Page 1 incident' }],
      total: 20,
      page: 1,
      totalPages: 2,
    };

    const page2 = {
      incidents: [{ id: '2', title: 'Page 2 incident' }],
      total: 20,
      page: 2,
      totalPages: 2,
    };

    (api.incidents.list as any)
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    const user = userEvent.setup();
    render(<IncidentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 incident')).toBeInTheDocument();
    });

    // 次のページへ
    await user.click(screen.getByLabelText('次のページ'));

    await waitFor(() => {
      expect(screen.getByText('Page 2 incident')).toBeInTheDocument();
      expect(api.incidents.list).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it('displays incident details on click', async () => {
    const mockIncident = {
      id: '1',
      title: 'Critical issue',
      description: 'Database connection failed',
      urgency: 'high',
      impact: 'high',
      type: '障害',
      status: 'open',
      createdAt: new Date('2024-01-01T10:00:00'),
      channel: { name: 'alerts' },
      message: { slackTs: '1234567890.123456' },
    };

    (api.incidents.list as any).mockResolvedValue({
      incidents: [mockIncident],
      total: 1,
      page: 1,
      totalPages: 1,
    });

    (api.incidents.get as any).mockResolvedValue(mockIncident);

    const user = userEvent.setup();
    render(<IncidentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Critical issue')).toBeInTheDocument();
    });

    // 行をクリック
    await user.click(screen.getByText('Critical issue'));

    // 詳細モーダルが表示される
    await waitFor(() => {
      expect(screen.getByText('インシデント詳細')).toBeInTheDocument();
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
      expect(screen.getByText('チャンネル: alerts')).toBeInTheDocument();
    });
  });

  it('provides accessible table with ARIA labels', () => {
    (api.incidents.list as any).mockResolvedValue({
      incidents: [],
      total: 0,
      page: 1,
      totalPages: 1,
    });

    render(<IncidentsPage />);

    const table = screen.getByRole('table', { name: 'インシデント一覧' });
    expect(table).toBeInTheDocument();

    // ヘッダー
    expect(screen.getByRole('columnheader', { name: 'タイトル' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '緊急度' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '影響度' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'タイプ' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'ステータス' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '作成日時' })).toBeInTheDocument();
  });
});
