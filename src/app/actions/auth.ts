'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { authenticateUser, registerUser } from '@/controllers/authController';
import { toActionResult } from '@/lib/actionResult';
import { prisma } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/session';
import { authStore } from '@/models/stores';

const setSessionCookie = async (raw: string, expiresAt: Date) => {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, raw, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
  });
};

export const registerAction = async (formData: FormData) => {
  const result = await toActionResult(async () => {
    const created = await registerUser(
      {
        email: String(formData.get('email') ?? ''),
        name: String(formData.get('name') ?? ''),
        password: String(formData.get('password') ?? ''),
      },
      { prisma: authStore },
    );
    const session = await authenticateUser(
      {
        email: String(formData.get('email') ?? ''),
        password: String(formData.get('password') ?? ''),
      },
      { prisma: authStore },
    );
    await setSessionCookie(session.sessionRaw, session.expiresAt);
    return created;
  });
  if (result.ok) {
    redirect('/');
  }
  return result;
};

export const loginAction = async (formData: FormData) => {
  const result = await toActionResult(async () => {
    const session = await authenticateUser(
      {
        email: String(formData.get('email') ?? ''),
        password: String(formData.get('password') ?? ''),
      },
      { prisma: authStore },
    );
    await setSessionCookie(session.sessionRaw, session.expiresAt);
    return session.userId;
  });
  if (result.ok) {
    redirect('/');
  }
  return result;
};

export const logoutAction = async () => {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) {
    const { hashSessionToken } = await import('@/lib/session');
    await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(raw) } });
  }
  jar.delete(SESSION_COOKIE);
  redirect('/login');
};
