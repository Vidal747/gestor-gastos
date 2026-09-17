import { describe, expect, it } from 'vitest';

import { formatInviteCode, normalizeInviteCode } from './inviteCode';
import { generateInviteCode } from './generateInviteCode';

describe('inviteCode', () => {
  it('generates a 6-character code without ambiguous glyphs', () => {
    const raw = generateInviteCode();
    expect(raw).toHaveLength(6);
    expect(raw).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it('formats and normalizes codes with a dash', () => {
    expect(formatInviteCode('K7PM2Q')).toBe('K7P-M2Q');
    expect(normalizeInviteCode('k7p-m2q')).toBe('K7PM2Q');
    expect(normalizeInviteCode(' k7pm2q ')).toBe('K7PM2Q');
  });
});
