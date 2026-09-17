import { beforeEach, describe, expect, it } from 'vitest';

import { connectByCode, listRelationships } from './relationshipController';

type User = { id: string; name: string; inviteCode: string };
type Connection = { lowUserId: string; highUserId: string; createdByUserId: string };
type Debt = {
  ownerUserId: string;
  ownerRole: 'DEBTOR' | 'CREDITOR';
  counterpartyUserId: string | null;
  remainingAmount: string;
  installments: [];
  payments: [];
  id: string;
  counterpartyName: string | null;
  description: string;
  originalAmount: string;
  status: string;
};

const users = new Map<string, User>();
const connections: Connection[] = [];
const debts: Debt[] = [];

const fakePrisma = {
  user: {
    findUnique: async ({ where }: { where: { id?: string; inviteCode?: string } }) => {
      if (where.id) {
        return [...users.values()].find((user) => user.id === where.id) ?? null;
      }
      if (where.inviteCode) {
        return [...users.values()].find((user) => user.inviteCode === where.inviteCode) ?? null;
      }
      return null;
    },
  },
  userConnection: {
    findUnique: async ({
      where: { lowUserId_highUserId },
    }: {
      where: { lowUserId_highUserId: { lowUserId: string; highUserId: string } };
    }) =>
      connections.find(
        (row) => row.lowUserId === lowUserId_highUserId.lowUserId && row.highUserId === lowUserId_highUserId.highUserId,
      ) ?? null,
    findMany: async ({ where: { OR } }: { where: { OR: Array<{ lowUserId?: string; highUserId?: string }> } }) =>
      connections.filter((row) =>
        OR.some((clause) => row.lowUserId === clause.lowUserId || row.highUserId === clause.highUserId),
      ),
    create: async ({ data }: { data: Connection }) => {
      connections.push(data);
      return data;
    },
  },
  debt: {
    findMany: async () => debts,
  },
};

describe('relationshipController', () => {
  beforeEach(() => {
    users.clear();
    connections.length = 0;
    debts.length = 0;
    users.set('ana', { id: 'ana', name: 'Ana', inviteCode: 'K7PM2Q' });
    users.set('bruno', { id: 'bruno', name: 'Bruno', inviteCode: 'B3N4R5' });
  });

  it('connects two users by invite code', async () => {
    const result = await connectByCode('b3n-4r5', 'ana', { prisma: fakePrisma });
    expect(result.peer.name).toBe('Bruno');
    expect(connections).toHaveLength(1);
  });

  it('rejects connecting to yourself', async () => {
    await expect(connectByCode('K7PM2Q', 'ana', { prisma: fakePrisma })).rejects.toMatchObject({
      code: 'VALIDATION',
    });
  });

  it('lists the net between connected people', async () => {
    await connectByCode('B3N4R5', 'ana', { prisma: fakePrisma });
    debts.push({
      id: 'd1',
      ownerUserId: 'ana',
      ownerRole: 'DEBTOR',
      counterpartyUserId: 'bruno',
      remainingAmount: '150',
      installments: [],
      payments: [],
      counterpartyName: null,
      description: 'Cena',
      originalAmount: '150',
      status: 'PENDING',
    });
    const list = await listRelationships('ana', { prisma: fakePrisma });
    expect(list).toHaveLength(1);
    expect(list[0].peer.name).toBe('Bruno');
    expect(list[0].direction).toBe('i_owe');
    expect(list[0].net.toNumber()).toBe(150);
  });
});
