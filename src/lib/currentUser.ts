import { cookies } from 'next/headers';

import { createAuthError } from '@/lib/errors';
import { prisma } from '@/lib/db';
import { ensureInviteCode } from '@/lib/ensureInviteCode';
import { hashSessionToken, SESSION_COOKIE } from '@/lib/session';

export type SessionUser = {
  id: string;
  name: string;
  inviteCode: string;
};

const loadUser = async (userId: string): Promise<SessionUser> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });
  if (!user) {
    throw createAuthError('Debes iniciar sesión.');
  }
  return { ...user, inviteCode: await ensureInviteCode(user.id) };
};

export const getCurrentUserId = async (): Promise<string> => {
  const user = await getCurrentUser();
  return user.id;
};

export const getCurrentUser = async (): Promise<SessionUser> => {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) {
    throw createAuthError('Debes iniciar sesión.');
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(raw) },
    select: { userId: true, expiresAt: true },
  });

  if (!session || session.expiresAt.getTime() < Date.now()) {
    throw createAuthError('Debes iniciar sesión.');
  }

  return loadUser(session.userId);
};

export const getOptionalUserId = async (): Promise<string | null> => {
  try {
    return await getCurrentUserId();
  } catch {
    return null;
  }
};

export const getOptionalUser = async (): Promise<SessionUser | null> => {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
};
