import type { Prisma, PrismaClient } from '@prisma/client';

import type { AuthStore } from '@/controllers/authController';
import type { CardStore, PersistedCard, PersistedPurchase } from '@/controllers/cardController';
import type { DebtStore, PersistedDebt } from '@/controllers/debtController';
import type { RelationshipStore } from '@/controllers/relationshipController';
import { prisma } from '@/lib/db';

type Client = PrismaClient | Prisma.TransactionClient;

const debtInclude = {
  installments: { include: { payments: true }, orderBy: { installmentNumber: 'asc' as const } },
  payments: true,
  owner: { select: { id: true, name: true } },
  counterparty: { select: { id: true, name: true, inviteCode: true } },
};

const cardInclude = {
  purchases: {
    include: {
      installmentsData: { include: { payments: true }, orderBy: { installmentNumber: 'asc' as const } },
    },
  },
};

const purchaseInclude = {
  card: { include: cardInclude },
  installmentsData: { include: { payments: true }, orderBy: { installmentNumber: 'asc' as const } },
};

export const asDebtStore = (client: Client): DebtStore => ({
  $transaction: async (fn) => {
    if ('$transaction' in client) {
      return client.$transaction((tx) => fn(asDebtStore(tx)));
    }
    return fn(asDebtStore(client));
  },
  user: {
    findUnique: async ({ where }) => client.user.findUnique({ where, select: { id: true } }),
  },
  debt: {
    create: async ({ data }) =>
      client.debt.create({ data, include: debtInclude }) as unknown as PersistedDebt,
    findUnique: async ({ where }) =>
      client.debt.findUnique({ where, include: debtInclude }) as unknown as PersistedDebt | null,
    findMany: async ({ where }) =>
      client.debt.findMany({ where, include: debtInclude }) as unknown as PersistedDebt[],
    update: async ({ where, data }) =>
      client.debt.update({ where, data, include: debtInclude }) as unknown as PersistedDebt,
  },
  debtInstallment: {
    update: async ({ where, data }) => client.debtInstallment.update({ where, data }),
  },
  debtPayment: {
    create: async ({ data }) => client.debtPayment.create({ data }),
  },
});

export const asCardStore = (client: Client): CardStore => ({
  $transaction: async (fn) => {
    if ('$transaction' in client) {
      return client.$transaction((tx) => fn(asCardStore(tx)));
    }
    return fn(asCardStore(client));
  },
  creditCard: {
    create: async ({ data }) =>
      client.creditCard.create({ data, include: cardInclude }) as unknown as PersistedCard,
    findUnique: async ({ where }) =>
      client.creditCard.findUnique({ where, include: cardInclude }) as unknown as PersistedCard | null,
    findMany: async ({ where }) =>
      client.creditCard.findMany({ where, include: cardInclude }) as unknown as PersistedCard[],
    update: async ({ where, data }) =>
      client.creditCard.update({ where, data, include: cardInclude }) as unknown as PersistedCard,
  },
  creditCardPurchase: {
    create: async ({ data }) =>
      client.creditCardPurchase.create({ data, include: purchaseInclude }) as unknown as PersistedPurchase,
    findUnique: async ({ where }) =>
      client.creditCardPurchase.findUnique({
        where,
        include: purchaseInclude,
      }) as unknown as (PersistedPurchase & { card: PersistedCard }) | null,
    update: async ({ where, data }) => client.creditCardPurchase.update({ where, data }),
  },
  purchaseInstallment: {
    update: async ({ where, data }) => client.purchaseInstallment.update({ where, data }),
  },
  purchaseInstallmentPayment: {
    create: async ({ data }) => client.purchaseInstallmentPayment.create({ data }),
  },
});

export const debtStore = asDebtStore(prisma);
export const cardStore = asCardStore(prisma);

export const relationshipStore: RelationshipStore = {
  user: {
    findUnique: async ({ where }) => {
      const user = await prisma.user.findUnique({
        where,
        select: { id: true, name: true, inviteCode: true },
      });
      if (!user) {
        return null;
      }
      return { ...user, inviteCode: user.inviteCode ?? '' };
    },
  },
  userConnection: {
    findUnique: async ({ where }) => prisma.userConnection.findUnique({ where }),
    findMany: async ({ where }) => prisma.userConnection.findMany({ where }),
    create: async ({ data }) => prisma.userConnection.create({ data }),
  },
  debt: {
    findMany: async ({ where }) =>
      prisma.debt.findMany({
        where,
        select: {
          ownerUserId: true,
          ownerRole: true,
          counterpartyUserId: true,
          remainingAmount: true,
        },
      }),
  },
};

export const authStore: AuthStore = {
  user: {
    findUnique: async ({ where }) => {
      const user = await prisma.user.findUnique({
        where,
        select: { id: true, email: true, name: true, passwordHash: true, inviteCode: true },
      });
      if (!user) {
        return null;
      }
      return { ...user, inviteCode: user.inviteCode ?? '' };
    },
    create: async ({ data }) => {
      const user = await prisma.user.create({ data });
      return { ...user, inviteCode: user.inviteCode ?? '' };
    },
  },
  session: {
    create: async ({ data }) => prisma.session.create({ data }),
  },
};
