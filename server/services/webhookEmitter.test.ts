import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

// Mock db before importing the module
vi.mock('../db/connection.js', () => {
  const prepare = vi.fn();
  return { default: { prepare } };
});

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import after mocks are set up
import db from '../db/connection.js';
import { sendTestPing, processRetryQueue } from './webhookEmitter.js';

const mockDb = db as any;

function makeDbChain(returnValue: any = undefined) {
  return {
    all: vi.fn().mockReturnValue(returnValue ?? []),
    get: vi.fn().mockReturnValue(returnValue),
    run: vi.fn().mockReturnValue({ lastInsertRowid: 1, changes: 1 }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HMAC signature', () => {
  it('generates correct sha256 HMAC in X-Estater-Signature header', async () => {
    const secret = 'test-secret-123';
    const webhook = { id: 1, name: 'Test', url: 'https://example.com/hook', secret, events: '*', active: 1 };

    // Mock db.prepare for SELECT and INSERT
    const selectChain = makeDbChain(webhook);
    const insertChain = makeDbChain();
    let callCount = 0;
    mockDb.prepare.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? selectChain : insertChain;
    });

    // Mock fetch to capture the request
    let capturedBody = '';
    let capturedHeaders: Record<string, string> = {};
    mockFetch.mockImplementation(async (_url: string, opts: any) => {
      capturedBody = opts.body;
      capturedHeaders = opts.headers;
      return { ok: true, status: 200, text: async () => 'ok' };
    });

    await sendTestPing(1);

    // Verify signature was sent
    expect(capturedHeaders['X-Estater-Signature']).toBeDefined();

    // Verify signature is correct
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(capturedBody).digest('hex');
    expect(capturedHeaders['X-Estater-Signature']).toBe(expected);
  });

  it('omits signature header when webhook has no secret', async () => {
    const webhook = { id: 1, name: 'Test', url: 'https://example.com/hook', secret: null, events: '*', active: 1 };

    const selectChain = makeDbChain(webhook);
    const insertChain = makeDbChain();
    let callCount = 0;
    mockDb.prepare.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? selectChain : insertChain;
    });

    let capturedHeaders: Record<string, string> = {};
    mockFetch.mockImplementation(async (_url: string, opts: any) => {
      capturedHeaders = opts.headers;
      return { ok: true, status: 200, text: async () => 'ok' };
    });

    await sendTestPing(1);

    expect(capturedHeaders['X-Estater-Signature']).toBeUndefined();
    expect(capturedHeaders['Content-Type']).toBe('application/json');
  });
});

describe('sendTestPing', () => {
  it('returns not found for non-existent webhook', async () => {
    mockDb.prepare.mockReturnValue(makeDbChain(undefined));

    const result = await sendTestPing(999);

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(0);
    expect(result.body).toBe('Webhook not found');
  });

  it('returns success when endpoint responds 200', async () => {
    const webhook = { id: 1, name: 'Test', url: 'https://example.com/hook', secret: null, events: '*', active: 1 };

    const selectChain = makeDbChain(webhook);
    const insertChain = makeDbChain();
    let callCount = 0;
    mockDb.prepare.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? selectChain : insertChain;
    });

    mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => 'OK' });

    const result = await sendTestPing(1);

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
  });

  it('returns failure when endpoint responds 500', async () => {
    const webhook = { id: 1, name: 'Test', url: 'https://example.com/hook', secret: null, events: '*', active: 1 };

    const selectChain = makeDbChain(webhook);
    const insertChain = makeDbChain();
    let callCount = 0;
    mockDb.prepare.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? selectChain : insertChain;
    });

    mockFetch.mockResolvedValue({ ok: false, status: 500, text: async () => 'Internal Server Error' });

    const result = await sendTestPing(1);

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(500);
  });

  it('handles network errors gracefully', async () => {
    const webhook = { id: 1, name: 'Test', url: 'https://example.com/hook', secret: null, events: '*', active: 1 };

    const selectChain = makeDbChain(webhook);
    const insertChain = makeDbChain();
    let callCount = 0;
    mockDb.prepare.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? selectChain : insertChain;
    });

    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await sendTestPing(1);

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(0);
    expect(result.body).toBe('ECONNREFUSED');
  });

  it('logs delivery result to webhook_logs', async () => {
    const webhook = { id: 1, name: 'Test', url: 'https://example.com/hook', secret: null, events: '*', active: 1 };

    const selectChain = makeDbChain(webhook);
    const insertChain = makeDbChain();
    let callCount = 0;
    mockDb.prepare.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? selectChain : insertChain;
    });

    mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => 'OK' });

    await sendTestPing(1);

    // Second prepare call should be the INSERT for logging
    expect(mockDb.prepare).toHaveBeenCalledTimes(2);
    expect(insertChain.run).toHaveBeenCalledWith(
      1, 'test.ping', expect.any(String), 200, 'OK', 1
    );
  });

  it('sends correct payload structure', async () => {
    const webhook = { id: 1, name: 'My Hook', url: 'https://example.com/hook', secret: null, events: '*', active: 1 };

    const selectChain = makeDbChain(webhook);
    const insertChain = makeDbChain();
    let callCount = 0;
    mockDb.prepare.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? selectChain : insertChain;
    });

    let capturedBody = '';
    mockFetch.mockImplementation(async (_url: string, opts: any) => {
      capturedBody = opts.body;
      return { ok: true, status: 200, text: async () => 'ok' };
    });

    await sendTestPing(1);

    const parsed = JSON.parse(capturedBody);
    expect(parsed.event).toBe('test.ping');
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(parsed.data.message).toBe('Test ping from Estater');
    expect(parsed.data.webhook_id).toBe(1);
    expect(parsed.data.webhook_name).toBe('My Hook');
  });
});

describe('processRetryQueue', () => {
  it('does nothing when queue is empty', async () => {
    mockDb.prepare.mockReturnValue(makeDbChain([]));

    await processRetryQueue();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('retries failed deliveries and removes from queue', async () => {
    const queueItem = {
      id: 10,
      webhook_id: 1,
      event: 'payment.paid',
      payload: JSON.stringify({ id: 42 }),
      next_retry_at: new Date(Date.now() - 1000).toISOString(),
      url: 'https://example.com/hook',
      secret: null,
      active: 1,
    };

    const selectChain = makeDbChain([queueItem]);
    const insertChain = makeDbChain();
    const deleteChain = makeDbChain();
    let callCount = 0;
    mockDb.prepare.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return selectChain;
      if (callCount === 2) return insertChain;
      return deleteChain;
    });

    mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => 'OK' });

    await processRetryQueue();

    // Should have called fetch once for the retry
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Should log the retry result
    expect(insertChain.run).toHaveBeenCalledWith(
      1, 'payment.paid (retry)', expect.any(String), 200, 'OK', 1
    );

    // Should delete from queue
    expect(deleteChain.run).toHaveBeenCalledWith(10);
  });

  it('removes item from queue even on retry failure (single retry only)', async () => {
    const queueItem = {
      id: 5,
      webhook_id: 1,
      event: 'contract.created',
      payload: JSON.stringify({ id: 1 }),
      next_retry_at: new Date(Date.now() - 1000).toISOString(),
      url: 'https://example.com/hook',
      secret: null,
      active: 1,
    };

    const selectChain = makeDbChain([queueItem]);
    const insertChain = makeDbChain();
    const deleteChain = makeDbChain();
    let callCount = 0;
    mockDb.prepare.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return selectChain;
      if (callCount === 2) return insertChain;
      return deleteChain;
    });

    mockFetch.mockResolvedValue({ ok: false, status: 500, text: async () => 'Error' });

    await processRetryQueue();

    // Still deletes from queue after failed retry
    expect(deleteChain.run).toHaveBeenCalledWith(5);
  });
});

describe('webhook payload delivery', () => {
  it('POSTs to the webhook URL with correct method and content-type', async () => {
    const webhook = { id: 1, name: 'Test', url: 'https://hooks.example.com/abc', secret: null, events: '*', active: 1 };

    const selectChain = makeDbChain(webhook);
    const insertChain = makeDbChain();
    let callCount = 0;
    mockDb.prepare.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? selectChain : insertChain;
    });

    mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => '' });

    await sendTestPing(1);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://hooks.example.com/abc',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: expect.any(String),
      })
    );
  });
});
