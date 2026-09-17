import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from './password';

describe('password', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('secret-pass-12');
    expect(hash).not.toBe('secret-pass-12');
    expect(await verifyPassword('secret-pass-12', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});
