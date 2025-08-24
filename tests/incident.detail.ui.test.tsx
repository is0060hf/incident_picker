import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { format } from 'date-fns';
import IncidentDetailPage from '../src/app/incidents/[id]/page';

// APIモック
vi.mock('../src/lib/api/client', () => ({
  api: {
    incidents: {
      getDetail: vi.fn(),
      updateDetail: vi.fn(),
      getHistory: vi.fn(),
      exportData: vi.fn(),
    },
  },
}));

const mockApi = vi.mocked((await import('../src/lib/api/client')).api);

describe('Incident Detail UI (Red phase)', () => {
  const mockIncident = {
    incident: {
      id: '1',
      title: 'Database connection error',
      description: 'Connection pool exhausted',
      urgency: 'high',
      impact: 'high',
      urgencyManual: false,
      impactManual: false,
      type: '障害',
      status: 'open',
      assignee: null,
      notes: null,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      channel: {
        name: 'incidents',
      },
      message: {
        raw: {
          text: 'DB接続エラーが発生しました',
          user: 'U123456',
        },
      },
    },
    slackUrl: 'https://slack.com/archives/C123456/p1704103200123456',
    threadMessages: [
      {
        raw: {
          text: '調査中です',
          user: 'U234567',
        },
      },
    ],
  };

  const mockHistory = [
    {
      id: 'h1',
      field: 'status',
      oldValue: 'open',
      newValue: 'in_progress',
      changedBy: 'user@example.com',
      changedAt: new Date('2024-01-01T11:00:00Z'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.incidents.getDetail.mockResolvedValue(mockIncident);
    mockApi.incidents.getHistory.mockResolvedValue(mockHistory);
    mockApi.incidents.updateDetail.mockResolvedValue({});
  });

  describe('Basic Display', () => {
    it('displays incident details', async () => {
      render(<IncidentDetailPage params={{ id: '1' }} />);

      // タイトルと説明が表示されるまで待つ
      await waitFor(() => {
        expect(screen.getByText('Database connection error')).toBeInTheDocument();
      });

      // 他の要素も確認
      expect(screen.getByText('Connection pool exhausted')).toBeInTheDocument();
      expect(screen.getByText('緊急度:')).toBeInTheDocument();
      expect(screen.getByText('影響度:')).toBeInTheDocument();
      expect(screen.getByText('タイプ:')).toBeInTheDocument();
      expect(screen.getByText('ステータス:')).toBeInTheDocument();
    });

    it('displays Slack message and thread', async () => {
      render(<IncidentDetailPage params={{ id: '1' }} />);

      await waitFor(() => {
        expect(screen.getByText('元のSlackメッセージ')).toBeInTheDocument();
        expect(screen.getByText('DB接続エラーが発生しました')).toBeInTheDocument();
        expect(screen.getByText('スレッドの返信')).toBeInTheDocument();
        expect(screen.getByText('調査中です')).toBeInTheDocument();
      });
    });

    it('displays link to Slack', async () => {
      render(<IncidentDetailPage params={{ id: '1' }} />);

      await waitFor(() => {
        const slackLink = screen.getByRole('link', { name: 'Slackで開く' });
        expect(slackLink).toHaveAttribute('href', 'https://slack.com/archives/C123456/p1704103200123456');
        expect(slackLink).toHaveAttribute('target', '_blank');
      });
    });
  });

  describe('Manual Override', () => {
    it('allows manual urgency override', async () => {
      render(<IncidentDetailPage params={{ id: '1' }} />);

      await waitFor(() => {
        expect(screen.getByText('緊急度を編集')).toBeInTheDocument();
      });

      // 編集モードに入る
      fireEvent.click(screen.getByText('緊急度を編集'));

      // 編集モードになったか確認
      expect(screen.getByLabelText('緊急度')).toBeInTheDocument();
      expect(screen.getByText('保存')).toBeInTheDocument();

      // 保存をクリック
      fireEvent.click(screen.getByText('保存'));

      await waitFor(() => {
        expect(mockApi.incidents.updateDetail).toHaveBeenCalled();
      });
    });

    it('allows manual impact override', async () => {
      render(<IncidentDetailPage params={{ id: '1' }} />);

      await waitFor(() => {
        expect(screen.getByText('影響度を編集')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('影響度を編集'));
      expect(screen.getByLabelText('影響度')).toBeInTheDocument();
      
      // 保存ボタンを探す
      const saveButtons = screen.getAllByText('保存');
      fireEvent.click(saveButtons[saveButtons.length - 1]); // 最後の保存ボタン

      await waitFor(() => {
        expect(mockApi.incidents.updateDetail).toHaveBeenCalled();
      });
    });

    it('shows manual override indicator', async () => {
      const manualIncident = {
        ...mockIncident,
        incident: {
          ...mockIncident.incident,
          urgencyManual: true,
          impactManual: true,
        },
      };
      mockApi.incidents.getDetail.mockResolvedValueOnce(manualIncident);

      render(<IncidentDetailPage params={{ id: '1' }} />);

      await waitFor(() => {
        expect(screen.getAllByText('手動設定')).toHaveLength(2); // 緊急度と影響度
      });
    });
  });

  describe('Status and Assignment', () => {
    it('allows status update', async () => {
      render(<IncidentDetailPage params={{ id: '1' }} />);

      await waitFor(() => {
        expect(screen.getByText('ステータス:')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('ステータス変更');
      fireEvent.change(statusSelect, { target: { value: 'in_progress' } });

      await waitFor(() => {
        expect(mockApi.incidents.updateDetail).toHaveBeenCalledWith('1', {
          status: 'in_progress',
        });
      });
    });

    it('allows assignee update', async () => {
      render(<IncidentDetailPage params={{ id: '1' }} />);

      await waitFor(() => {
        expect(screen.getByText('担当者: 未割当')).toBeInTheDocument();
      });

      const assigneeInput = screen.getByLabelText('担当者');
      fireEvent.change(assigneeInput, { target: { value: 'john@example.com' } });
      fireEvent.blur(assigneeInput);

      await waitFor(() => {
        expect(mockApi.incidents.updateDetail).toHaveBeenCalledWith('1', {
          assignee: 'john@example.com',
        });
      });
    });
  });

  describe('Notes', () => {
    it('allows adding and updating notes', async () => {
      render(<IncidentDetailPage params={{ id: '1' }} />);

      await waitFor(() => {
        expect(screen.getByLabelText('メモ')).toBeInTheDocument();
      });

      const notesTextarea = screen.getByLabelText('メモ');
      fireEvent.change(notesTextarea, { target: { value: '根本原因を調査中' } });
      fireEvent.blur(notesTextarea);

      await waitFor(() => {
        expect(mockApi.incidents.updateDetail).toHaveBeenCalled();
      });
    });
  });

  describe('History', () => {
    it('displays update history', async () => {
      render(<IncidentDetailPage params={{ id: '1' }} />);

      // 先にページがロードされるのを待つ
      await waitFor(() => {
        expect(screen.getByText('Database connection error')).toBeInTheDocument();
      });

      // 履歴セクションを確認
      expect(screen.getByText('更新履歴')).toBeInTheDocument();
      expect(screen.getByText(/status/)).toBeInTheDocument();
      expect(screen.getByText(/user@example\.com/)).toBeInTheDocument();
    });
  });

  describe('Export', () => {
    it('allows data export', async () => {
      render(<IncidentDetailPage params={{ id: '1' }} />);

      await waitFor(() => {
        expect(screen.getByText('データをエクスポート')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('データをエクスポート');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockApi.incidents.exportData).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper aria labels and roles', async () => {
      render(<IncidentDetailPage params={{ id: '1' }} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Database connection error');
        expect(screen.getByLabelText('ステータス変更')).toBeInTheDocument();
        expect(screen.getByLabelText('担当者')).toBeInTheDocument();
        expect(screen.getByLabelText('メモ')).toBeInTheDocument();
      });
    });

    it('announces changes to screen readers', async () => {
      render(<IncidentDetailPage params={{ id: '1' }} />);

      await waitFor(() => {
        expect(screen.getByLabelText('ステータス変更')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('ステータス変更');
      fireEvent.change(statusSelect, { target: { value: 'resolved' } });

      await waitFor(() => {
        expect(mockApi.incidents.updateDetail).toHaveBeenCalled();
      });
    });
  });
});
