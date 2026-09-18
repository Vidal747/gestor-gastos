import Decimal from 'decimal.js';
import { ZodError } from 'zod';

import { createNotFoundError, createValidationError } from '@/lib/errors';
import { toMoney } from '@/lib/finance';
import { createAccountInputSchema, type CreateAccountInput } from '@/validations/account';

export type AccountStore = {
  account: {
    create: (args: {
      data: {
        userId: string;
        name: string;
        type: string;
        currency: string;
      };
    }) => Promise<PersistedAccount>;
    findUnique: (args: { where: { id: string } }) => Promise<PersistedAccount | null>;
    findMany: (args: { where: { userId: string } }) => Promise<PersistedAccount[]>;
    update: (args: {
      where: { id: string };
      data: { name?: string; type?: string; isDefault?: boolean };
    }) => Promise<PersistedAccount>;
    delete: (args: { where: { id: string } }) => Promise<unknown>;
  };
  income?: {
    findMany: (args: { where: { accountId: string } }) => Promise<Array<{ amount: Decimal | string | number }>>;
  };
};

export type PersistedAccount = {
  id: string;
  userId: string;
  name: string;
  type: string;
  currency: string;
  isDefault: boolean;
};

export type AccountView = {
  id: string;
  name: string;
  type: string;
  currency: string;
  isDefault: boolean;
  balance: Decimal;
  incomeTotal: Decimal;
};

const parseOrValidation = <T>(parse: () => T): T => {
  try {
    return parse();
  } catch (error) {
    if (error instanceof ZodError) {
      throw createValidationError(error.issues[0]?.message ?? 'Revisa los datos.');
    }
    throw error;
  }
};

const toView = (account: PersistedAccount): AccountView => ({
  id: account.id,
  name: account.name,
  type: account.type,
  currency: account.currency,
  isDefault: account.isDefault,
  balance: new Decimal(0),
  incomeTotal: new Decimal(0),
});

export const createAccount = async (
  input: CreateAccountInput,
  currentUserId: string,
  deps: { prisma: AccountStore },
): Promise<AccountView> => {
  const parsed = parseOrValidation(() => createAccountInputSchema.parse(input));
  const created = await deps.prisma.account.create({
    data: {
      userId: currentUserId,
      name: parsed.name,
      type: parsed.type,
      currency: parsed.currency,
    },
  });
  return toView(created);
};

export const listAccounts = async (
  currentUserId: string,
  deps: { prisma: AccountStore },
): Promise<AccountView[]> => {
  const rows = await deps.prisma.account.findMany({ where: { userId: currentUserId } });
  return rows.map(toView);
};

export const getAccount = async (
  accountId: string,
  currentUserId: string,
  deps: { prisma: AccountStore },
): Promise<AccountView> => {
  const account = await deps.prisma.account.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== currentUserId) {
    throw createNotFoundError('Cuenta no encontrada.');
  }
  return toView(account);
};

export const updateAccount = async (
  accountId: string,
  input: { name?: string; type?: string },
  currentUserId: string,
  deps: { prisma: AccountStore },
): Promise<AccountView> => {
  const account = await deps.prisma.account.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== currentUserId) {
    throw createNotFoundError('Cuenta no encontrada.');
  }

  const data: Record<string, unknown> = {};
  if (input.name?.trim()) {
    data.name = input.name.trim();
  }
  if (input.type) {
    data.type = input.type;
  }

  if (Object.keys(data).length === 0) {
    return toView(account);
  }

  const updated = await deps.prisma.account.update({ where: { id: accountId }, data });
  return toView(updated);
};

export const deleteAccount = async (
  accountId: string,
  currentUserId: string,
  deps: { prisma: AccountStore },
): Promise<void> => {
  const account = await deps.prisma.account.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== currentUserId) {
    throw createNotFoundError('Cuenta no encontrada.');
  }
  if (account.isDefault) {
    throw createValidationError('No se puede eliminar la cuenta por defecto.');
  }
  await deps.prisma.account.delete({ where: { id: accountId } });
};
