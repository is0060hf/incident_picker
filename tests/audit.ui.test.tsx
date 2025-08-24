import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuditLogsPage from '../src/app/audit/page';
import { format } from 'date-fns';

// APIモック
vi.mock('../src/lib/api/client', () => ({
  api: {
    audit: {
      getLogs: vi.fn(),
      getActionSummary: vi.fn(),
      getUserActivity: vi.fn(),
    },
  },
}));

const mockApi = vi.mocked((await import('../src/lib/api/client')).api);

describe('Audit Logs UI', () => {
  const mockLogs = [
    {
      id: '1',
      userId: 'user1',
      user: { email: 'user1@example.com' },
      action: 'UPDATE_INCIDENT',
      targetType: 'incident',
      targetId: 'inc1',
      changes: {
        urgency: { from: 'low', to: 'high' },
        impact: { from: 'medium', to: 'high' },
      },
      metadata: {
        incidentTitle: 'Database connection error',
        manual: true,
      },
      createdAt: new Date('2024-01-01T10:00:00Z'),
    },
    {
      id: '2',
      userId: 'user2',
      user: { email: 'user2@example.com' },
      action: 'CREATE_RULE',
      targetType: 'rule',
      targetId: 'rule1',
      metadata: {
        ruleName: 'Critical Error Pattern',
      },
      createdAt: new Date('2024-01-01T11:00:00Z'),
    },
  ];

  const mockSummary = [
    { action: 'UPDATE_INCIDENT', count: 25 },
    { action: 'CREATE_RULE', count: 10 },
    { action: 'DELETE_CHANNEL', count: 3 },
  ];

  const mockActivity = [
    { userId: 'user1', email: 'user1@example.com', actionCount: 50 },
    { userId: 'user2', email: 'user2@example.com', actionCount: 30 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.audit.getLogs.mockResolvedValue({
      logs: mockLogs,
      total: 2,
    });
    mockApi.audit.getActionSummary.mockResolvedValue(mockSummary);
    mockApi.audit.getUserActivity.mockResolvedValue(mockActivity);
  });

  describe('Audit Logs List', () => {
    it('displays audit logs', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });

      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('Database connection error')).toBeInTheDocument();
      
      // テーブル内のアクション表示を確認
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('インシデント更新');
    });

    it('displays change details', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.getByText(/urgency: low → high/)).toBeInTheDocument();
        expect(screen.getByText(/impact: medium → high/)).toBeInTheDocument();
      });
    });

    it('formats timestamps', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        const expectedDate = format(new Date('2024-01-01T10:00:00Z'), 'yyyy/MM/dd HH:mm:ss');
        expect(screen.getByText(expectedDate)).toBeInTheDocument();
      });
    });
  });

  describe('Filters', () => {
    it('displays filter options', () => {
      render(<AuditLogsPage />);

      expect(screen.getByLabelText('アクション')).toBeInTheDocument();
      expect(screen.getByLabelText('対象タイプ')).toBeInTheDocument();
      expect(screen.getByLabelText('開始日')).toBeInTheDocument();
      expect(screen.getByLabelText('終了日')).toBeInTheDocument();
    });

    it('filters by action', async () => {
      render(<AuditLogsPage />);

      const actionSelect = screen.getByLabelText('アクション');
      fireEvent.change(actionSelect, { target: { value: 'UPDATE_INCIDENT' } });

      await waitFor(() => {
        expect(mockApi.audit.getLogs).toHaveBeenCalledWith(
          expect.objectContaining({
            action: ['UPDATE_INCIDENT'],
          })
        );
      });
    });

    it('filters by date range', async () => {
      render(<AuditLogsPage />);

      const fromDate = screen.getByLabelText('開始日');
      const toDate = screen.getByLabelText('終了日');

      fireEvent.change(fromDate, { target: { value: '2024-01-01' } });
      fireEvent.change(toDate, { target: { value: '2024-01-31' } });

      await waitFor(() => {
        expect(mockApi.audit.getLogs).toHaveBeenCalledWith(
          expect.objectContaining({
            from: expect.any(Date),
            to: expect.any(Date),
          })
        );
      });
    });
  });

  describe('Summary View', () => {
    it('displays action summary', async () => {
      render(<AuditLogsPage />);

      const summaryTab = screen.getByText('サマリー');
      fireEvent.click(summaryTab);

      await waitFor(() => {
        // サマリー表示が読み込まれるのを待つ
        expect(screen.getByText('25回')).toBeInTheDocument();
      });

      // サマリー内容の確認（各要素が存在することを確認）
      expect(screen.getByText('25回')).toBeInTheDocument();
      expect(screen.getByText('10回')).toBeInTheDocument();
      expect(screen.getByText('3回')).toBeInTheDocument();
    });

    it('displays user activity', async () => {
      render(<AuditLogsPage />);

      const activityTab = screen.getByText('ユーザー活動');
      fireEvent.click(activityTab);

      await waitFor(() => {
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
        expect(screen.getByText('50回')).toBeInTheDocument();
        expect(screen.getByText('user2@example.com')).toBeInTheDocument();
        expect(screen.getByText('30回')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('displays pagination controls', async () => {
      mockApi.audit.getLogs.mockResolvedValueOnce({
        logs: mockLogs,
        total: 50,
      });

      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('次へ')).toBeInTheDocument();
        expect(screen.getByText('1 / 3')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper table structure', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getAllByRole('columnheader')).toHaveLength(5);
      });
    });

    it('has accessible form controls', () => {
      render(<AuditLogsPage />);

      expect(screen.getByLabelText('アクション')).toBeInTheDocument();
      expect(screen.getByLabelText('対象タイプ')).toBeInTheDocument();
    });
  });
});
