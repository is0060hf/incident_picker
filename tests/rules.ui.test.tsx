import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RulesPage from '../src/app/rules/page';

// APIモック
vi.mock('../src/lib/api/client', () => ({
  api: {
    urgencyRules: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    impactRules: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { api } from '../src/lib/api/client';

describe('Rules Management UI (Red phase)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays urgency and impact rule tabs', async () => {
    (api.urgencyRules.list as any).mockResolvedValue([]);
    (api.impactRules.list as any).mockResolvedValue([]);

    render(<RulesPage />);

    expect(screen.getByRole('tab', { name: '緊急度ルール' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '影響度ルール' })).toBeInTheDocument();
  });

  it('lists existing rules', async () => {
    const mockUrgencyRules = [
      { id: '1', name: 'Critical', pattern: 'critical|fatal', value: 'high', enabled: true },
      { id: '2', name: 'Warning', pattern: 'warn|alert', value: 'medium', enabled: false },
    ];
    
    (api.urgencyRules.list as any).mockResolvedValue(mockUrgencyRules);
    (api.impactRules.list as any).mockResolvedValue([]);

    render(<RulesPage />);

    await waitFor(() => {
      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByText('critical|fatal')).toBeInTheDocument();
      expect(screen.getByText('高')).toBeInTheDocument();
    });
  });

  it('creates new rule', async () => {
    (api.urgencyRules.list as any).mockResolvedValue([]);
    (api.urgencyRules.create as any).mockResolvedValue({
      id: '3',
      name: 'New Rule',
      pattern: 'error',
      value: 'high',
      enabled: true,
    });

    const user = userEvent.setup();
    render(<RulesPage />);

    // 新規作成ボタンをクリック
    await user.click(screen.getByText('新規ルール追加'));

    // フォームに入力
    await user.type(screen.getByLabelText('ルール名'), 'New Rule');
    await user.type(screen.getByLabelText('パターン'), 'error');
    await user.selectOptions(screen.getByLabelText('緊急度'), 'high');

    // 保存
    await user.click(screen.getByText('保存'));

    await waitFor(() => {
      expect(api.urgencyRules.create).toHaveBeenCalledWith({
        name: 'New Rule',
        pattern: 'error',
        value: 'high',
        enabled: true,
      });
    });
  });

  it('tests pattern matching', async () => {
    (api.urgencyRules.list as any).mockResolvedValue([]);
    
    const user = userEvent.setup();
    render(<RulesPage />);

    await user.click(screen.getByText('新規ルール追加'));
    await user.type(screen.getByLabelText('パターン'), 'critical|fatal');
    await user.type(screen.getByLabelText('テストテキスト'), 'This is a critical error');

    await waitFor(() => {
      expect(screen.getByText('マッチしました')).toBeInTheDocument();
    });
  });

  it('updates existing rule', async () => {
    const mockRules = [
      { id: '1', name: 'Old Name', pattern: 'old', value: 'low', enabled: true },
    ];
    
    (api.urgencyRules.list as any).mockResolvedValue(mockRules);
    (api.urgencyRules.update as any).mockResolvedValue({
      id: '1',
      name: 'New Name',
      pattern: 'new',
      value: 'high',
      enabled: false,
    });

    const user = userEvent.setup();
    render(<RulesPage />);

    await waitFor(() => {
      expect(screen.getByText('Old Name')).toBeInTheDocument();
    });

    // 編集ボタンをクリック
    await user.click(screen.getByLabelText('編集'));

    // フォームを更新
    const nameInput = screen.getByLabelText('ルール名');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');

    // 保存
    await user.click(screen.getByText('保存'));

    await waitFor(() => {
      expect(api.urgencyRules.update).toHaveBeenCalledWith('1', expect.objectContaining({
        name: 'New Name',
      }));
    });
  });

  it('deletes rule with confirmation', async () => {
    const mockRules = [
      { id: '1', name: 'To Delete', pattern: 'delete', value: 'low', enabled: true },
    ];
    
    (api.urgencyRules.list as any).mockResolvedValue(mockRules);
    (api.urgencyRules.delete as any).mockResolvedValue(undefined);

    window.confirm = vi.fn(() => true);

    const user = userEvent.setup();
    render(<RulesPage />);

    await waitFor(() => {
      expect(screen.getByText('To Delete')).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    await user.click(screen.getByLabelText('削除'));

    expect(window.confirm).toHaveBeenCalledWith('このルールを削除しますか？');
    
    await waitFor(() => {
      expect(api.urgencyRules.delete).toHaveBeenCalledWith('1');
    });
  });
});
