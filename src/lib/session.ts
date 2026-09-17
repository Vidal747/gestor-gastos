import { createHash, randomBytes } from 'node:crypto';

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const hashSessionToken = (raw: string): string => createHash('sha256').update(raw).digest('hex');

export const createSessionToken = (): { raw: string; hash: string } => {
  const raw = randomBytes(32).toString('hex');
  return { raw, hash: hashSessionToken(raw) };
};
