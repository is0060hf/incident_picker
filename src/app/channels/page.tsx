'use client';

import { useState, useEffect } from 'react';
import { Channel } from '@prisma/client';

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 新規チャンネル作成フォーム
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChannel, setNewChannel] = useState({
    slackChannelId: '',
    name: '',
    enabled: true,
  });

  // チャンネル一覧を取得
  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/channels');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setChannels(data);
    } catch (err) {
      setError('チャンネルの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChannel),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create');
      }
      
      await fetchChannels();
      setShowAddForm(false);
      setNewChannel({ slackChannelId: '', name: '', enabled: true });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleEnabled = async (channel: Channel) => {
    try {
      const res = await fetch(`/api/channels/${channel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !channel.enabled }),
      });
      
      if (!res.ok) throw new Error('Failed to update');
      await fetchChannels();
    } catch (err) {
      alert('更新に失敗しました');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このチャンネルを削除しますか？')) return;
    
    try {
      const res = await fetch(`/api/channels/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      await fetchChannels();
    } catch (err) {
      alert('削除に失敗しました');
    }
  };

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div role="alert">{error}</div>;

  return (
    <main>
      <h1>チャンネル管理</h1>
      
      <button onClick={() => setShowAddForm(!showAddForm)}>
        {showAddForm ? 'キャンセル' : '新規チャンネル追加'}
      </button>

      {showAddForm && (
        <form onSubmit={handleAddChannel} aria-label="新規チャンネル追加フォーム">
          <div>
            <label htmlFor="slackChannelId">Slack チャンネルID</label>
            <input
              id="slackChannelId"
              type="text"
              value={newChannel.slackChannelId}
              onChange={(e) => setNewChannel({ ...newChannel, slackChannelId: e.target.value })}
              required
              placeholder="例: C1234567890"
            />
          </div>
          
          <div>
            <label htmlFor="channelName">チャンネル名</label>
            <input
              id="channelName"
              type="text"
              value={newChannel.name}
              onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
              required
              placeholder="例: incident-reports"
            />
          </div>
          
          <div>
            <label>
              <input
                type="checkbox"
                checked={newChannel.enabled}
                onChange={(e) => setNewChannel({ ...newChannel, enabled: e.target.checked })}
              />
              有効
            </label>
          </div>
          
          <button type="submit">追加</button>
        </form>
      )}

      <table role="table">
        <thead>
          <tr>
            <th scope="col">チャンネル名</th>
            <th scope="col">Slack ID</th>
            <th scope="col">状態</th>
            <th scope="col">操作</th>
          </tr>
        </thead>
        <tbody>
          {channels.map((channel) => (
            <tr key={channel.id}>
              <td>{channel.name}</td>
              <td>{channel.slackChannelId}</td>
              <td>
                <button
                  onClick={() => handleToggleEnabled(channel)}
                  aria-label={`${channel.name}を${channel.enabled ? '無効化' : '有効化'}`}
                >
                  {channel.enabled ? '有効' : '無効'}
                </button>
              </td>
              <td>
                <button
                  onClick={() => handleDelete(channel.id)}
                  aria-label={`${channel.name}を削除`}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
