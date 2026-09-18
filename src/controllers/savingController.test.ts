import { beforeEach, describe, expect, it } from 'vitest';

import { addSavingContribution, createSavingGoal, getSavingGoal, type SavingStore } from './savingController';

type Goal = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  targetAmount: string;
  targetDate: Date | null;
  status: string;
  participants: Array<{ userId: string; user?: { id: string; name: string } }>;
  contributions: Array<{
    id: string;
    userId: string;
    amount: string;
    contributionDate: Date;
    description: string | null;
    user?: { id: string; name: string };
  }>;
};

const goals = new Map<string, Goal>();
const users = new Map<string, { id: string; name: string }>([
  ['ana', { id: 'ana', name: 'Ana' }],
  ['tomas', { id: 'tomas', name: 'Tomás' }],
]);
const links = new Set<string>(['ana:tomas']);
let nextId = 1;

const clone = (row: Goal): Goal => structuredClone(row);

let fakePrisma: SavingStore;
fakePrisma = {
  user: {
    findUnique: async ({ where }) => users.get(where.id) ?? null,
  },
  userConnection: {
    findUnique: async ({ where }) => {
      const key = `${where.lowUserId_highUserId.lowUserId}:${where.lowUserId_highUserId.highUserId}`;
      const alt = `${where.lowUserId_highUserId.highUserId}:${where.lowUserId_highUserId.lowUserId}`;
      return links.has(key) || links.has(alt) ? { id: 'link' } : null;
    },
  },
  savingGoal: {
    create: async ({ data }) => {
      const id = `save-${nextId}`;
      nextId += 1;
      const row: Goal = {
        id,
        userId: data.userId,
        name: data.name,
        description: data.description,
        targetAmount: String(data.targetAmount),
        targetDate: data.targetDate,
        status: data.status,
        participants: data.participants.create.map((item) => ({
          userId: item.userId,
          user: users.get(item.userId),
        })),
        contributions: [],
      };
      goals.set(id, row);
      return clone(row);
    },
    findUnique: async ({ where }) => {
      const row = goals.get(where.id);
      return row ? clone(row) : null;
    },
    findMany: async ({ where }) => {
      const userId = where.OR[0] && 'userId' in where.OR[0] ? where.OR[0].userId : '';
      return [...goals.values()]
        .filter((row) => row.userId === userId || row.participants.some((participant) => participant.userId === userId))
        .map(clone);
    },
    update: async ({ where, data }) => {
      const row = goals.get(where.id);
      if (row && data.status) {
        row.status = data.status;
      }
      return row ? clone(row) : null;
    },
    delete: async ({ where }) => {
      goals.delete(where.id);
    },
  },
  savingContribution: {
    create: async ({ data }) => {
      const row = goals.get(data.savingGoalId);
      if (!row) {
        throw new Error('missing');
      }
      row.contributions.push({
        id: `c-${row.contributions.length + 1}`,
        userId: data.userId,
        amount: String(data.amount),
        contributionDate: new Date('2026-09-16T17:00:00Z'),
        description: data.description,
        user: users.get(data.userId),
      });
      return data;
    },
  },
};

describe('savingController', () => {
  beforeEach(() => {
    goals.clear();
    nextId = 1;
  });

  it('creates a personal saving goal', async () => {
    const created = await createSavingGoal(
      { name: 'Viaje', targetAmount: '10000000' },
      'ana',
      { prisma: fakePrisma },
    );
    expect(created.name).toBe('Viaje');
    expect(created.savedAmount.toNumber()).toBe(0);
    expect(created.participants.map((person) => person.id)).toEqual(['ana']);
  });

  it('rejects sharing with someone who is not linked', async () => {
    await expect(
      createSavingGoal({ name: 'Viaje', targetAmount: '100', participantUserIds: ['ghost'] }, 'ana', {
        prisma: fakePrisma,
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('adds a contribution and marks the goal completed at the target', async () => {
    const created = await createSavingGoal({ name: 'Fondo', targetAmount: '100' }, 'ana', { prisma: fakePrisma });
    const updated = await addSavingContribution({ savingGoalId: created.id, amount: '100' }, 'ana', {
      prisma: fakePrisma,
    });
    expect(updated.savedAmount.toNumber()).toBe(100);
    expect(updated.status).toBe('COMPLETED');
    const loaded = await getSavingGoal(created.id, 'ana', { prisma: fakePrisma });
    expect(loaded.status).toBe('COMPLETED');
  });

  it('hides a saving from a stranger', async () => {
    const created = await createSavingGoal({ name: 'Fondo', targetAmount: '100' }, 'ana', { prisma: fakePrisma });
    await expect(getSavingGoal(created.id, 'tomas', { prisma: fakePrisma })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
