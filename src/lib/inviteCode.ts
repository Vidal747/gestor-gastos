const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const INVITE_CODE_ALPHABET = ALPHABET;

export const normalizeInviteCode = (value: string): string =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, '');

export const formatInviteCode = (value: string): string => {
  const normalized = normalizeInviteCode(value);
  if (normalized.length !== 6) {
    return normalized;
  }
  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
};
