import { randomBytes } from 'node:crypto';

import { INVITE_CODE_ALPHABET } from '@/lib/inviteCode';

export const generateInviteCode = (): string => {
  const bytes = randomBytes(6);
  return Array.from(bytes, (byte) => INVITE_CODE_ALPHABET[byte % INVITE_CODE_ALPHABET.length]).join('');
};
