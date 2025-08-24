import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRateLimiter } from '../src/lib/slack/rateLimiter';

describe('Rate Limiter with Backoff (Red phase)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enforces rate limit of 20 requests per minute', async () => {
    const limiter = createRateLimiter({
      maxRequests: 20,
      windowMs: 60000, // 1 minute
    });

    const execute = vi.fn().mockResolvedValue('success');

    // 20 requests should succeed immediately
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(limiter.execute(execute));
    }

    await Promise.all(promises);
    expect(execute).toHaveBeenCalledTimes(20);

    // 21st request should be delayed
    execute.mockClear();
    const delayedPromise = limiter.execute(execute);
    
    // Should not execute immediately
    expect(execute).not.toHaveBeenCalled();

    // Fast forward time
    await vi.runAllTimersAsync();

    await delayedPromise;
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('implements exponential backoff on 429 errors', async () => {
    const limiter = createRateLimiter();
    
    let attempt = 0;
    const execute = vi.fn().mockImplementation(async () => {
      attempt++;
      if (attempt < 3) {
        const error = new Error('rate_limited') as any;
        error.status = 429;
        error.headers = { 'retry-after': '1' };
        throw error;
      }
      return 'success';
    });

    const promise = limiter.execute(execute);
    
    // First attempt should happen immediately
    expect(execute).toHaveBeenCalledTimes(1);
    
    // Fast forward for first retry
    await vi.advanceTimersByTimeAsync(1000);
    expect(execute).toHaveBeenCalledTimes(2);
    
    // Fast forward for second retry
    await vi.advanceTimersByTimeAsync(1000);
    expect(execute).toHaveBeenCalledTimes(3);
    
    const result = await promise;
    expect(result).toBe('success');
  });

  it('respects Retry-After header', async () => {
    const limiter = createRateLimiter();
    
    const execute = vi.fn()
      .mockRejectedValueOnce({
        status: 429,
        headers: { 'retry-after': '5' }, // 5 seconds
      })
      .mockResolvedValueOnce('success');

    const promise = limiter.execute(execute);
    
    // First call should happen immediately
    expect(execute).toHaveBeenCalledTimes(1);
    
    // Second call should wait for retry-after
    await vi.advanceTimersByTimeAsync(4999);
    expect(execute).toHaveBeenCalledTimes(1);
    
    await vi.advanceTimersByTimeAsync(1);
    expect(execute).toHaveBeenCalledTimes(2);
    
    const result = await promise;
    expect(result).toBe('success');
  });

  it('gives up after max retries', async () => {
    const limiter = createRateLimiter({ maxRetries: 3 });
    
    const execute = vi.fn().mockRejectedValue({
      status: 429,
      headers: { 'retry-after': '1' },
    });

    const promise = limiter.execute(execute);
    
    // Initial attempt
    expect(execute).toHaveBeenCalledTimes(1);
    
    // Retry 1
    await vi.advanceTimersByTimeAsync(1000);
    expect(execute).toHaveBeenCalledTimes(2);
    
    // Retry 2
    await vi.advanceTimersByTimeAsync(1000);
    expect(execute).toHaveBeenCalledTimes(3);
    
    // Retry 3
    await vi.advanceTimersByTimeAsync(1000);
    expect(execute).toHaveBeenCalledTimes(4);
    
    // Should fail after max retries
    await expect(promise).rejects.toMatchObject({
      status: 429,
    });
  });
});
