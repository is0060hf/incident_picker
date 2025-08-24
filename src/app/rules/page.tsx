'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';

interface Rule {
  id: string;
  name: string;
  pattern: string;
  value: 'high' | 'medium' | 'low';
  enabled: boolean;
}

export default function RulesPage() {
  const [activeTab, setActiveTab] = useState<'urgency' | 'impact'>('urgency');
  const [urgencyRules, setUrgencyRules] = useState<Rule[]>([]);
  const [impactRules, setImpactRules] = useState<Rule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [testPattern, setTestPattern] = useState('');
  const [testText, setTestText] = useState('');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    const [urgency, impact] = await Promise.all([
      api.urgencyRules.list(),
      api.impactRules.list(),
    ]);
    setUrgencyRules(urgency);
    setImpactRules(impact);
  };

  const handleSave = async (data: Omit<Rule, 'id'>) => {
    if (editingRule) {
      if (activeTab === 'urgency') {
        await api.urgencyRules.update(editingRule.id, data);
      } else {
        await api.impactRules.update(editingRule.id, data);
      }
    } else {
      if (activeTab === 'urgency') {
        await api.urgencyRules.create(data);
      } else {
        await api.impactRules.create(data);
      }
    }
    setShowForm(false);
    setEditingRule(null);
    loadRules();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('このルールを削除しますか？')) return;
    
    if (activeTab === 'urgency') {
      await api.urgencyRules.delete(id);
    } else {
      await api.impactRules.delete(id);
    }
    loadRules();
  };

  const testPatternMatch = () => {
    if (!testPattern || !testText) return null;
    try {
      const regex = new RegExp(testPattern, 'i');
      return regex.test(testText);
    } catch {
      return false;
    }
  };

  const rules = activeTab === 'urgency' ? urgencyRules : impactRules;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">ルール設定</h2>

      {/* タブ */}
      <div className="border-b" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'urgency'}
          onClick={() => setActiveTab('urgency')}
          className={`px-4 py-2 ${activeTab === 'urgency' ? 'border-b-2 border-primary' : ''}`}
        >
          緊急度ルール
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'impact'}
          onClick={() => setActiveTab('impact')}
          className={`px-4 py-2 ${activeTab === 'impact' ? 'border-b-2 border-primary' : ''}`}
        >
          影響度ルール
        </button>
      </div>

      {/* 新規作成ボタン */}
      <button
        onClick={() => {
          setShowForm(true);
          setEditingRule(null);
        }}
        className="bg-primary text-white px-4 py-2 rounded"
      >
        新規ルール追加
      </button>

      {/* ルールフォーム */}
      {showForm && (
        <form
          role="dialog"
          aria-labelledby="form-title"
          aria-modal="true"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSave({
              name: formData.get('name') as string,
              pattern: formData.get('pattern') as string,
              value: formData.get('value') as 'high' | 'medium' | 'low',
              enabled: editingRule ? formData.get('enabled') === 'on' : true,
            });
          }}
          className="bg-white p-6 rounded shadow space-y-4"
        >
          <div>
            <label htmlFor="name">ルール名</label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={editingRule?.name}
              required
              aria-required="true"
              aria-invalid={false}
              className="w-full border p-2"
            />
          </div>

          <div>
            <label htmlFor="pattern">パターン</label>
            <input
              id="pattern"
              name="pattern"
              type="text"
              defaultValue={editingRule?.pattern}
              onChange={(e) => setTestPattern(e.target.value)}
              required
              className="w-full border p-2"
            />
          </div>

          <div>
            <label htmlFor="value">{activeTab === 'urgency' ? '緊急度' : '影響度'}</label>
            <select
              id="value"
              name="value"
              defaultValue={editingRule?.value || 'low'}
              className="w-full border p-2"
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>

          <div>
            <label htmlFor="test-text">テストテキスト</label>
            <input
              id="test-text"
              type="text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full border p-2"
            />
            {testPattern && testText && (
              <p className={testPatternMatch() ? 'text-success' : 'text-error'}>
                {testPatternMatch() ? 'マッチしました' : 'マッチしません'}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded">
              保存
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingRule(null);
              }}
              className="border px-4 py-2 rounded"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* ルール一覧 */}
      <div className="bg-white rounded shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">ルール名</th>
              <th className="p-4 text-left">パターン</th>
              <th className="p-4 text-left">{activeTab === 'urgency' ? '緊急度' : '影響度'}</th>
              <th className="p-4 text-left">状態</th>
              <th className="p-4 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-b">
                <td className="p-4">{rule.name}</td>
                <td className="p-4 font-mono text-sm">{rule.pattern}</td>
                <td className="p-4">
                  {rule.value === 'high' ? '高' : rule.value === 'medium' ? '中' : '低'}
                </td>
                <td className="p-4">
                  {rule.enabled ? '有効' : '無効'}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => {
                      setEditingRule(rule);
                      setShowForm(true);
                    }}
                    aria-label="編集"
                    className="text-primary mr-2"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    aria-label="削除"
                    className="text-error"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
