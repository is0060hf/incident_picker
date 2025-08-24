import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchPage from '../src/app/search/page';

// APIモック
vi.mock('../src/lib/api/client', () => ({
  api: {
    search: {
      searchIncidents: vi.fn(),
      getSuggestions: vi.fn(),
    },
    channels: {
      list: vi.fn(),
    },
  },
}));

const mockApi = vi.mocked((await import('../src/lib/api/client')).api);

describe('Search UI (Red phase)', () => {
  const mockIncidents = [
    {
      id: '1',
      title: 'Database connection error',
      description: 'Connection pool exhausted',
      urgency: 'high',
      impact: 'high',
      type: '障害',
      status: 'open',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      channel: { name: 'incidents' },
      searchRank: 0.8,
    },
    {
      id: '2',
      title: 'Login database issue',
      description: 'Users cannot login',
      urgency: 'high',
      impact: 'high',
      type: '障害',
      status: 'resolved',
      createdAt: new Date('2024-01-02T10:00:00Z'),
      channel: { name: 'alerts' },
      searchRank: 0.6,
    },
  ];

  const mockChannels = [
    { id: 'ch1', name: 'incidents' },
    { id: 'ch2', name: 'alerts' },
  ];

  const mockSuggestions = [
    { term: 'database error', count: 15 },
    { term: 'database connection', count: 10 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.channels.list.mockResolvedValue(mockChannels);
    mockApi.search.searchIncidents.mockResolvedValue({
      incidents: mockIncidents,
      total: 2,
    });
    mockApi.search.getSuggestions.mockResolvedValue(mockSuggestions);
  });

  describe('Search Input', () => {
    it('displays search input and button', () => {
      render(<SearchPage />);

      expect(screen.getByPlaceholderText('インシデントを検索...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '検索' })).toBeInTheDocument();
    });

    it('performs search on button click', async () => {
      render(<SearchPage />);

      const input = screen.getByPlaceholderText('インシデントを検索...');
      const button = screen.getByRole('button', { name: '検索' });

      fireEvent.change(input, { target: { value: 'database error' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockApi.search.searchIncidents).toHaveBeenCalledWith('database error', expect.any(Object));
      });
    });

    it('performs search on enter key', async () => {
      render(<SearchPage />);

      const input = screen.getByPlaceholderText('インシデントを検索...');

      fireEvent.change(input, { target: { value: 'error' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(mockApi.search.searchIncidents).toHaveBeenCalledWith('error', expect.any(Object));
      });
    });

    it('shows search suggestions', async () => {
      render(<SearchPage />);

      const input = screen.getByPlaceholderText('インシデントを検索...');
      fireEvent.change(input, { target: { value: 'datab' } });

      await waitFor(() => {
        expect(mockApi.search.getSuggestions).toHaveBeenCalledWith('datab');
        expect(screen.getByText('database error (15)')).toBeInTheDocument();
        expect(screen.getByText('database connection (10)')).toBeInTheDocument();
      });
    });
  });

  describe('Search Results', () => {
    it('displays search results', async () => {
      render(<SearchPage />);

      const input = screen.getByPlaceholderText('インシデントを検索...');
      const button = screen.getByRole('button', { name: '検索' });

      fireEvent.change(input, { target: { value: 'database' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockApi.search.searchIncidents).toHaveBeenCalled();
      });

      expect(screen.getByText('Database connection error')).toBeInTheDocument();
      expect(screen.getByText('Login database issue')).toBeInTheDocument();
      expect(screen.getByText(/2件の結果/)).toBeInTheDocument();
    });

    it('displays search rank', async () => {
      render(<SearchPage />);

      const input = screen.getByPlaceholderText('インシデントを検索...');
      fireEvent.change(input, { target: { value: 'database' } });
      fireEvent.click(screen.getByRole('button', { name: '検索' }));

      await waitFor(() => {
        expect(screen.getByText('関連度: 80%')).toBeInTheDocument();
        expect(screen.getByText('関連度: 60%')).toBeInTheDocument();
      });
    });

    it('displays no results message', async () => {
      mockApi.search.searchIncidents.mockResolvedValueOnce({
        incidents: [],
        total: 0,
      });

      render(<SearchPage />);

      const input = screen.getByPlaceholderText('インシデントを検索...');
      fireEvent.change(input, { target: { value: 'nonexistent' } });
      fireEvent.click(screen.getByRole('button', { name: '検索' }));

      await waitFor(() => {
        expect(screen.getByText('検索結果が見つかりませんでした')).toBeInTheDocument();
      });
    });
  });

  describe('Search Filters', () => {
    it('displays filter options', async () => {
      render(<SearchPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('緊急度')).toBeInTheDocument();
        expect(screen.getByLabelText('影響度')).toBeInTheDocument();
        expect(screen.getByLabelText('タイプ')).toBeInTheDocument();
        expect(screen.getByLabelText('ステータス')).toBeInTheDocument();
        expect(screen.getByLabelText('チャンネル')).toBeInTheDocument();
      });
    });

    it('searches with filters', async () => {
      render(<SearchPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('緊急度')).toBeInTheDocument();
      });

      const urgencySelect = screen.getByLabelText('緊急度');
      fireEvent.change(urgencySelect, { target: { value: 'high' } });

      const typeSelect = screen.getByLabelText('タイプ');
      fireEvent.change(typeSelect, { target: { value: '障害' } });

      const input = screen.getByPlaceholderText('インシデントを検索...');
      fireEvent.change(input, { target: { value: 'error' } });
      fireEvent.click(screen.getByRole('button', { name: '検索' }));

      await waitFor(() => {
        expect(mockApi.search.searchIncidents).toHaveBeenCalledWith('error', {
          urgency: ['high'],
          type: '障害',
          limit: 20,
          offset: 0,
        });
      });
    });
  });

  describe('Pagination', () => {
    it('displays pagination controls', async () => {
      mockApi.search.searchIncidents.mockResolvedValueOnce({
        incidents: mockIncidents,
        total: 50,
      });

      render(<SearchPage />);

      const input = screen.getByPlaceholderText('インシデントを検索...');
      fireEvent.change(input, { target: { value: 'database' } });
      fireEvent.click(screen.getByRole('button', { name: '検索' }));

      await waitFor(() => {
        expect(screen.getByText('次へ')).toBeInTheDocument();
        expect(screen.getByText('1 / 3')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<SearchPage />);

      expect(screen.getByLabelText('検索キーワード')).toBeInTheDocument();
    });

    it('announces search results', async () => {
      render(<SearchPage />);

      const input = screen.getByPlaceholderText('インシデントを検索...');
      fireEvent.change(input, { target: { value: 'database' } });
      fireEvent.click(screen.getByRole('button', { name: '検索' }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('2件の結果が見つかりました');
      });
    });
  });
});
