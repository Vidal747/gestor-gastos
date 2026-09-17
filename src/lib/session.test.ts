import { describe, expect, it } from 'vitest';

import { createSessionToken, hashSessionToken } from './session';

describe('session token', () => {
  it('creates a raw token and a distinct hash', () => {
    const token = createSessionToken();
    expect(token.raw).toHaveLength(64);
    expect(token.hash).toBe(hashSessionToken(token.raw));
    expect(token.hash).not.toBe(token.raw);
  });
});
