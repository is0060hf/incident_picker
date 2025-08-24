import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportsPage from '../src/app/reports/page';

// APIモック
vi.mock('../src/lib/api/client', () => ({
  api: {
    reports: {
      downloadIncidentReport: vi.fn(),
      downloadChannelReport: vi.fn(),
      downloadSummaryReport: vi.fn(),
    },
    channels: {
      list: vi.fn(),
    },
  },
}));

const mockApi = vi.mocked((await import('../src/lib/api/client')).api);

// Blobモック
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('Reports UI (Red phase)', () => {
  const mockChannels = [
    { id: 'ch1', name: 'incidents', slackChannelId: 'C123456' },
    { id: 'ch2', name: 'bugs', slackChannelId: 'C234567' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.channels.list.mockResolvedValue(mockChannels);
    mockApi.reports.downloadIncidentReport.mockResolvedValue(
      new Blob(['csv content'], { type: 'text/csv' })
    );
    mockApi.reports.downloadChannelReport.mockResolvedValue(
      new Blob(['csv content'], { type: 'text/csv' })
    );
    mockApi.reports.downloadSummaryReport.mockResolvedValue(
      new Blob(['csv content'], { type: 'text/csv' })
    );
  });

  describe('Page Layout', () => {
    it('displays page title and sections', async () => {
      render(<ReportsPage />);

      expect(screen.getByText('レポート')).toBeInTheDocument();
      expect(screen.getByText('インシデントレポート')).toBeInTheDocument();
      expect(screen.getByText('チャンネル統計レポート')).toBeInTheDocument();
      expect(screen.getByText('サマリーレポート')).toBeInTheDocument();
    });
  });

  describe('Incident Report', () => {
    it('displays filter options', async () => {
      render(<ReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('フィルター')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('緊急度')).toBeInTheDocument();
      expect(screen.getByLabelText('影響度')).toBeInTheDocument();
      expect(screen.getByLabelText('タイプ')).toBeInTheDocument();
      expect(screen.getByLabelText('ステータス')).toBeInTheDocument();
      expect(screen.getByLabelText('チャンネル')).toBeInTheDocument();
      expect(screen.getByLabelText('開始日')).toBeInTheDocument();
      expect(screen.getByLabelText('終了日')).toBeInTheDocument();
    });

    it('downloads incident report without filters', async () => {
      render(<ReportsPage />);

      const downloadButton = screen.getByText('インシデントレポートをダウンロード');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockApi.reports.downloadIncidentReport).toHaveBeenCalledWith({});
      });
    });

    it('downloads incident report with filters', async () => {
      render(<ReportsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('緊急度')).toBeInTheDocument();
      });

      // フィルターを設定
      const urgencySelect = screen.getByLabelText('緊急度');
      fireEvent.change(urgencySelect, { target: { value: 'high' } });

      const typeSelect = screen.getByLabelText('タイプ');
      fireEvent.change(typeSelect, { target: { value: '障害' } });

      const startDate = screen.getByLabelText('開始日');
      fireEvent.change(startDate, { target: { value: '2024-01-01' } });

      const endDate = screen.getByLabelText('終了日');
      fireEvent.change(endDate, { target: { value: '2024-01-31' } });

      const downloadButton = screen.getByText('インシデントレポートをダウンロード');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockApi.reports.downloadIncidentReport).toHaveBeenCalledWith({
          urgency: ['high'],
          type: '障害',
          from: '2024-01-01',
          to: '2024-01-31',
        });
      });
    });
  });

  describe('Channel Report', () => {
    it('downloads channel report', async () => {
      render(<ReportsPage />);

      const downloadButton = screen.getByText('チャンネル統計をダウンロード');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockApi.reports.downloadChannelReport).toHaveBeenCalled();
      });
    });
  });

  describe('Summary Report', () => {
    it('displays date range selector', async () => {
      render(<ReportsPage />);

      const summarySection = screen.getByText('サマリーレポート').parentElement;
      expect(summarySection).toBeInTheDocument();

      const startDate = screen.getByLabelText('集計開始日');
      const endDate = screen.getByLabelText('集計終了日');

      expect(startDate).toBeInTheDocument();
      expect(endDate).toBeInTheDocument();
    });

    it('downloads summary report with date range', async () => {
      render(<ReportsPage />);

      const startDate = screen.getByLabelText('集計開始日');
      fireEvent.change(startDate, { target: { value: '2024-01-01' } });

      const endDate = screen.getByLabelText('集計終了日');
      fireEvent.change(endDate, { target: { value: '2024-01-31' } });

      const downloadButton = screen.getByText('サマリーレポートをダウンロード');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockApi.reports.downloadSummaryReport).toHaveBeenCalledWith(
          '2024-01-01',
          '2024-01-31'
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', async () => {
      render(<ReportsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('緊急度')).toBeInTheDocument();
      });

      // フォーム要素のラベル確認
      expect(screen.getByLabelText('影響度')).toBeInTheDocument();
      expect(screen.getByLabelText('タイプ')).toBeInTheDocument();
      expect(screen.getByLabelText('ステータス')).toBeInTheDocument();
      expect(screen.getByLabelText('チャンネル')).toBeInTheDocument();
      expect(screen.getByLabelText('開始日')).toBeInTheDocument();
      expect(screen.getByLabelText('終了日')).toBeInTheDocument();
      expect(screen.getByLabelText('集計開始日')).toBeInTheDocument();
      expect(screen.getByLabelText('集計終了日')).toBeInTheDocument();
    });

    it('has proper heading structure', async () => {
      render(<ReportsPage />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('レポート');
      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h2s).toHaveLength(3);
    });
  });
});
