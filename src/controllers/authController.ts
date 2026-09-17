import { ZodError } from 'zod';

import { createAuthError, createConflictError, createValidationError } from '@/lib/errors';
import { hashPassword, verifyPassword } from '@/lib/password';
import { generateInviteCode } from '@/lib/generateInviteCode';
import { createSessionToken, SESSION_TTL_MS } from '@/lib/session';
import { loginInputSchema, registerInputSchema, type LoginInput, type RegisterInput } from '@/validations/auth';

export type AuthUserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  inviteCode: string;
};

export type AuthStore = {
  user: {
    findUnique: (args: { where: { email: string } | { inviteCode: string } }) => Promise<AuthUserRecord | null>;
    create: (args: {
      data: { email: string; name: string; passwordHash: string; inviteCode: string };
    }) => Promise<AuthUserRecord>;
  };
  session: {
    create: (args: { data: { tokenHash: string; userId: string; expiresAt: Date } }) => Promise<unknown>;
  };
};

const parseOrValidation = <T>(parse: () => T): T => {
  try {
    return parse();
  } catch (error) {
    if (error instanceof ZodError) {
      throw createValidationError(error.issues[0]?.message ?? 'Invalid input.');
    }
    throw error;
  }
};

export const registerUser = async (
  input: RegisterInput,
  deps: { prisma: AuthStore },
): Promise<{ userId: string }> => {
  const parsed = parseOrValidation(() => registerInputSchema.parse(input));
  const existing = await deps.prisma.user.findUnique({ where: { email: parsed.email } });
  if (existing) {
    throw createConflictError('Ya existe una cuenta con ese email.');
  }

  let inviteCode = generateInviteCode();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const taken = await deps.prisma.user.findUnique({ where: { inviteCode } });
    if (!taken) {
      break;
    }
    inviteCode = generateInviteCode();
  }

  const user = await deps.prisma.user.create({
    data: {
      email: parsed.email,
      name: parsed.name,
      passwordHash: await hashPassword(parsed.password),
      inviteCode,
    },
  });

  return { userId: user.id };
};

export const authenticateUser = async (
  input: LoginInput,
  deps: { prisma: AuthStore },
): Promise<{ userId: string; sessionRaw: string; expiresAt: Date }> => {
  const parsed = parseOrValidation(() => loginInputSchema.parse(input));
  const user = await deps.prisma.user.findUnique({ where: { email: parsed.email } });
  if (!user || !(await verifyPassword(parsed.password, user.passwordHash))) {
    throw createAuthError('Email o contraseña incorrectos.');
  }

  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await deps.prisma.session.create({
    data: {
      tokenHash: token.hash,
      userId: user.id,
      expiresAt,
    },
  });

  return { userId: user.id, sessionRaw: token.raw, expiresAt };
};
