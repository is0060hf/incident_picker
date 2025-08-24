import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from './setup/prisma-mock';
import { createChannelsApi } from '../src/lib/api/channelsApi';

describe('Channels API (Red phase)', () => {
  const api = createChannelsApi(prismaMock as any);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates and lists channels', async () => {
    const input = {
      slackChannelId: 'C123456',
      name: 'incident-reports',
      enabled: true,
    };
    
    const mockChannel = { id: '1', ...input };
    prismaMock.channel.create.mockResolvedValue(mockChannel);
    prismaMock.channel.findMany.mockResolvedValue([mockChannel]);
    
    const created = await api.createChannel(input);
    expect(created.id).toBeDefined();
    expect(created.slackChannelId).toBe('C123456');
    expect(created.name).toBe('incident-reports');
    expect(created.enabled).toBe(true);

    const channels = await api.listChannels();
    expect(channels).toHaveLength(1);
    expect(channels[0].id).toBe(created.id);
  });

  it('updates channel', async () => {
    const mockChannel = {
      id: '1',
      slackChannelId: 'C789',
      name: 'test',
      enabled: true,
    };
    
    const updatedChannel = {
      ...mockChannel,
      name: 'test-updated',
      enabled: false,
    };
    
    prismaMock.channel.create.mockResolvedValue(mockChannel);
    prismaMock.channel.update.mockResolvedValue(updatedChannel);

    const created = await api.createChannel({
      slackChannelId: 'C789',
      name: 'test',
      enabled: true,
    });

    const updated = await api.updateChannel(created.id, {
      name: 'test-updated',
      enabled: false,
    });

    expect(updated.name).toBe('test-updated');
    expect(updated.enabled).toBe(false);
    expect(updated.slackChannelId).toBe('C789'); // unchanged
  });

  it('deletes channel', async () => {
    const mockChannel = {
      id: '1',
      slackChannelId: 'C999',
      name: 'to-delete',
      enabled: true,
    };
    
    prismaMock.channel.create.mockResolvedValue(mockChannel);
    prismaMock.channel.delete.mockResolvedValue(mockChannel);
    prismaMock.channel.findMany.mockResolvedValue([]);

    const created = await api.createChannel({
      slackChannelId: 'C999',
      name: 'to-delete',
      enabled: true,
    });

    await api.deleteChannel(created.id);

    const channels = await api.listChannels();
    expect(channels).toHaveLength(0);
  });

  it('prevents duplicate slackChannelId', async () => {
    const firstChannel = {
      id: '1',
      slackChannelId: 'C123',
      name: 'first',
      enabled: true,
    };
    
    prismaMock.channel.create
      .mockResolvedValueOnce(firstChannel)
      .mockRejectedValueOnce(new Error('Unique constraint violation'));

    await api.createChannel({
      slackChannelId: 'C123',
      name: 'first',
      enabled: true,
    });

    await expect(
      api.createChannel({
        slackChannelId: 'C123',
        name: 'second',
        enabled: true,
      })
    ).rejects.toThrow();
  });
});
