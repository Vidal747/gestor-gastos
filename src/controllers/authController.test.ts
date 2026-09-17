import { beforeEach, describe, expect, it } from 'vitest';

import { authenticateUser, registerUser } from './authController';

type FakeUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  inviteCode: string;
};

const users = new Map<string, FakeUser>();
const sessions: Array<{ tokenHash: string; userId: string; expiresAt: Date }> = [];
let nextId = 1;

const fakePrisma = {
  user: {
    findUnique: async ({ where }: { where: { email?: string; inviteCode?: string } }) => {
      if (where.email) {
        return users.get(where.email) ?? null;
      }
      if (where.inviteCode) {
        return [...users.values()].find((user) => user.inviteCode === where.inviteCode) ?? null;
      }
      return null;
    },
    create: async ({ data }: { data: { email: string; name: string; passwordHash: string; inviteCode: string } }) => {
      const user = { id: `user-${nextId}`, ...data };
      nextId += 1;
      users.set(data.email, user);
      return user;
    },
  },
  session: {
    create: async ({ data }: { data: { tokenHash: string; userId: string; expiresAt: Date } }) => {
      sessions.push(data);
      return data;
    },
  },
};

describe('authController', () => {
  beforeEach(() => {
    users.clear();
    sessions.length = 0;
    nextId = 1;
  });

  it('registers a unique email', async () => {
    const result = await registerUser(
      { email: 'Ana@B.co', name: 'Ana', password: 'password12' },
      { prisma: fakePrisma },
    );
    expect(result.userId).toBe('user-1');
    expect(users.get('ana@b.co')?.name).toBe('Ana');
    expect(users.get('ana@b.co')?.inviteCode).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it('rejects a duplicate email', async () => {
    await registerUser({ email: 'a@b.co', name: 'Ana', password: 'password12' }, { prisma: fakePrisma });
    await expect(
      registerUser({ email: 'a@b.co', name: 'Ana', password: 'password12' }, { prisma: fakePrisma }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('rejects short passwords', async () => {
    await expect(
      registerUser({ email: 'c@d.co', name: 'C', password: 'short' }, { prisma: fakePrisma }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('authenticates a registered user and opens a session', async () => {
    await registerUser({ email: 'a@b.co', name: 'Ana', password: 'password12' }, { prisma: fakePrisma });
    const result = await authenticateUser({ email: 'a@b.co', password: 'password12' }, { prisma: fakePrisma });
    expect(result.userId).toBe('user-1');
    expect(result.sessionRaw).toHaveLength(64);
    expect(sessions).toHaveLength(1);
  });

  it('rejects invalid credentials with the same auth error', async () => {
    await expect(
      authenticateUser({ email: 'missing@b.co', password: 'password12' }, { prisma: fakePrisma }),
    ).rejects.toMatchObject({ code: 'AUTH', message: 'Email o contraseña incorrectos.' });
  });
});
