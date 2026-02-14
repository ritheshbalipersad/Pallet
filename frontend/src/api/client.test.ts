import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from './client';

describe('authApi', () => {
  beforeEach(() => {
    (globalThis as unknown as { fetch: unknown }).fetch = vi.fn();
    localStorage.clear();
  });

  it('login sends POST to /api/auth/login', async () => {
    const mockRes = { ok: true, json: () => Promise.resolve({ access_token: 'jwt', user: {} }) };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);
    const result = await authApi.login('admin', 'pass');
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'admin', password: 'pass' }),
      }),
    );
    expect(result.access_token).toBe('jwt');
  });
});
