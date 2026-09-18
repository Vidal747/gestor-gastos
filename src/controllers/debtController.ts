import Decimal from 'decimal.js';
import { ZodError } from 'zod';

import { createNotFoundError, createValidationError } from '@/lib/errors';
import {
  assertManualSchedule,
  fromCalendarDate,
  installmentOutstanding,
  toMoney,
  type CalendarDate,
} from '@/lib/finance';
import { createDebtInputSchema, payDebtInputSchema, type CreateDebtInput, type PayDebtInput } from '@/validations/debt';

export type DebtStore = {
  $transaction: <T>(fn: (tx: DebtStore) => Promise<T>) => Promise<T>;
  user: {
    findUnique: (args: { where: { id: string } }) => Promise<{ id: string } | null>;
  };
  debt: {
    create: (args: {
      data: {
        ownerUserId: string;
        ownerRole: 'DEBTOR' | 'CREDITOR';
        counterpartyUserId: string | null;
        counterpartyName: string | null;
        description: string;
        originalAmount: string;
        remainingAmount: string;
        status: 'PENDING';
        installments: {
          create: Array<{
            installmentNumber: number;
            amount: string;
            dueDate: Date;
            status: 'OPEN';
          }>;
        };
      };
    }) => Promise<PersistedDebt>;
    findUnique: (args: { where: { id: string } }) => Promise<PersistedDebt | null>;
    findMany: (args: { where: { OR: Array<{ ownerUserId: string } | { counterpartyUserId: string }> } }) => Promise<PersistedDebt[]>;
    update: (args: {
      where: { id: string };
      data: { remainingAmount?: string; status?: 'PENDING' | 'PARTIALLY_PAID' | 'PAID'; description?: string; counterpartyUserId?: string | null; counterpartyName?: string | null; ownerRole?: 'DEBTOR' | 'CREDITOR' };
    }) => Promise<PersistedDebt>;
    delete: (args: { where: { id: string } }) => Promise<unknown>;
  };
  debtInstallment: {
    update: (args: { where: { id: string }; data: { status: 'OPEN' | 'PAID' } }) => Promise<unknown>;
  };
  debtPayment: {
    create: (args: {
      data: { debtId: string; installmentId: string; amount: string; notes?: string };
    }) => Promise<unknown>;
  };
};

export type PersistedInstallment = {
  id: string;
  installmentNumber: number;
  amount: Decimal | string | number;
  dueDate: Date;
  status: string;
  payments: Array<{ amount: Decimal | string | number }>;
};

export type PersistedDebt = {
  id: string;
  ownerUserId: string;
  ownerRole: 'DEBTOR' | 'CREDITOR';
  counterpartyUserId: string | null;
  counterpartyName: string | null;
  counterparty?: { id: string; name: string; inviteCode: string } | null;
  owner?: { id: string; name: string } | null;
  description: string;
  originalAmount: Decimal | string | number;
  remainingAmount: Decimal | string | number;
  status: string;
  installments: PersistedInstallment[];
  payments: Array<{ amount: Decimal | string | number; installmentId: string }>;
};

export type DebtView = {
  id: string;
  ownerUserId: string;
  ownerRole: 'DEBTOR' | 'CREDITOR';
  counterpartyUserId: string | null;
  counterpartyName: string | null;
  counterpartyLabel: string;
  ownerName: string;
  description: string;
  originalAmount: Decimal;
  remainingAmount: Decimal;
  status: string;
  installments: Array<{
    id: string;
    installmentNumber: number;
    amount: Decimal;
    outstanding: Decimal;
    dueDate: Date;
    status: string;
  }>;
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

const moneyString = (value: Decimal | number | string): string => toMoney(value).toFixed(2);

const toView = (debt: PersistedDebt): DebtView => {
  const installments = [...debt.installments]
    .sort((left, right) => left.installmentNumber - right.installmentNumber)
    .map((item) => {
      const amount = toMoney(item.amount);
      const outstanding = installmentOutstanding(
        amount,
        (item.payments ?? []).map((payment) => payment.amount),
      );
      return {
        id: item.id,
        installmentNumber: item.installmentNumber,
        amount,
        outstanding,
        dueDate: item.dueDate,
        status: outstanding.eq(0) ? 'PAID' : item.status,
      };
    });

  const remaining = installmentOutstanding(
    debt.originalAmount,
    (debt.payments ?? []).map((payment) => payment.amount),
  );

  return {
    id: debt.id,
    ownerUserId: debt.ownerUserId,
    ownerRole: debt.ownerRole,
    counterpartyUserId: debt.counterpartyUserId,
    counterpartyName: debt.counterpartyName,
    counterpartyLabel: debt.counterparty?.name ?? debt.counterpartyName ?? 'alguien',
    ownerName: debt.owner?.name ?? 'alguien',
    description: debt.description,
    originalAmount: toMoney(debt.originalAmount),
    remainingAmount: remaining,
    status: remaining.eq(0) ? 'PAID' : remaining.lt(toMoney(debt.originalAmount)) ? 'PARTIALLY_PAID' : debt.status,
    installments,
  };
};

const canView = (debt: PersistedDebt, currentUserId: string): boolean =>
  debt.ownerUserId === currentUserId || debt.counterpartyUserId === currentUserId;

const loadVisibleDebt = async (debtId: string, currentUserId: string, prisma: DebtStore): Promise<PersistedDebt> => {
  const debt = await prisma.debt.findUnique({ where: { id: debtId } });
  if (!debt || !canView(debt, currentUserId)) {
    throw createNotFoundError('Debt not found.');
  }
  return debt;
};

export const createDebt = async (
  input: CreateDebtInput,
  currentUserId: string,
  deps: { prisma: DebtStore },
): Promise<DebtView> => {
  const parsed = parseOrValidation(() => createDebtInputSchema.parse(input));
  if (parsed.counterpartyUserId === currentUserId) {
    throw createValidationError('The counterparty cannot be the same as the owner.');
  }
  if (parsed.counterpartyUserId) {
    const counterparty = await deps.prisma.user.findUnique({ where: { id: parsed.counterpartyUserId } });
    if (!counterparty) {
      throw createValidationError('The counterparty user does not exist.');
    }
  }

  try {
    assertManualSchedule(parsed.originalAmount, parsed.installments);
  } catch (error) {
    throw createValidationError(error instanceof Error ? error.message : 'Invalid schedule.');
  }

  const created = await deps.prisma.debt.create({
    data: {
      ownerUserId: currentUserId,
      ownerRole: parsed.ownerRole,
      counterpartyUserId: parsed.counterpartyUserId ?? null,
      counterpartyName: parsed.counterpartyName ?? null,
      description: parsed.description,
      originalAmount: moneyString(parsed.originalAmount),
      remainingAmount: moneyString(parsed.originalAmount),
      status: 'PENDING',
      installments: {
        create: parsed.installments.map((row, index) => ({
          installmentNumber: index + 1,
          amount: moneyString(row.amount),
          dueDate: fromCalendarDate(row.dueDate as CalendarDate),
          status: 'OPEN',
        })),
      },
    },
  });

  return toView(created);
};

export const getDebt = async (
  debtId: string,
  currentUserId: string,
  deps: { prisma: DebtStore },
): Promise<DebtView> => {
  const debt = await loadVisibleDebt(debtId, currentUserId, deps.prisma);
  return toView(debt);
};

export const listDebts = async (currentUserId: string, deps: { prisma: DebtStore }): Promise<DebtView[]> => {
  const rows = await deps.prisma.debt.findMany({
    where: {
      OR: [{ ownerUserId: currentUserId }, { counterpartyUserId: currentUserId }],
    },
  });
  return rows.map(toView);
};

export type UpdateDebtInput = {
  description?: string;
  ownerRole?: 'DEBTOR' | 'CREDITOR';
  counterpartyUserId?: string | null;
  counterpartyName?: string | null;
};

export const updateDebt = async (
  debtId: string,
  input: UpdateDebtInput,
  currentUserId: string,
  deps: { prisma: DebtStore },
): Promise<DebtView> => {
  const debt = await loadVisibleDebt(debtId, currentUserId, deps.prisma);
  if (debt.ownerUserId !== currentUserId) {
    throw createNotFoundError('Debt not found.');
  }

  const view = toView(debt);
  if (view.status === 'PAID') {
    throw createValidationError('No se puede editar una deuda saldada.');
  }

  const data: Record<string, unknown> = {};
  if (input.description !== undefined) {
    if (!input.description.trim()) {
      throw createValidationError('La descripción no puede estar vacía.');
    }
    data.description = input.description.trim();
  }
  if (input.ownerRole !== undefined) {
    data.ownerRole = input.ownerRole;
  }
  if (input.counterpartyUserId !== undefined) {
    data.counterpartyUserId = input.counterpartyUserId;
  }
  if (input.counterpartyName !== undefined) {
    data.counterpartyName = input.counterpartyName?.trim() || null;
  }

  if (Object.keys(data).length === 0) {
    return view;
  }

  const updated = await deps.prisma.debt.update({ where: { id: debtId }, data });
  return toView(updated);
};

export const deleteDebt = async (
  debtId: string,
  currentUserId: string,
  deps: { prisma: DebtStore },
): Promise<void> => {
  const debt = await deps.prisma.debt.findUnique({ where: { id: debtId } });
  if (!debt || debt.ownerUserId !== currentUserId) {
    throw createNotFoundError('Debt not found.');
  }

  const view = toView(debt);
  if (view.status === 'PAID' && view.installments.some((i) => i.outstanding.eq(0))) {
    throw createValidationError('No se puede eliminar una deuda con pagos registrados.');
  }

  await deps.prisma.debt.delete({ where: { id: debtId } });
};

export const payDebtInstallment = async (
  input: PayDebtInput,
  currentUserId: string,
  deps: { prisma: DebtStore },
): Promise<DebtView> => {
  const parsed = parseOrValidation(() => payDebtInputSchema.parse(input));
  const debt = await deps.prisma.debt.findUnique({ where: { id: parsed.debtId } });
  if (!debt || debt.ownerUserId !== currentUserId) {
    throw createNotFoundError('Debt not found.');
  }

  const view = toView(debt);
  const current = view.installments.find((item) => item.outstanding.gt(0));
  if (!current) {
    throw createValidationError('There is no open installment to pay.');
  }

  const amount = toMoney(parsed.amount);
  if (amount.gt(current.outstanding)) {
    throw createValidationError('The payment exceeds the outstanding installment.');
  }

  const nextOutstanding = current.outstanding.minus(amount);
  const remaining = view.remainingAmount.minus(amount);
  const debtStatus = remaining.eq(0) ? 'PAID' : 'PARTIALLY_PAID';

  await deps.prisma.$transaction(async (tx) => {
    await tx.debtPayment.create({
      data: {
        debtId: debt.id,
        installmentId: current.id,
        amount: moneyString(amount),
        notes: parsed.notes,
      },
    });
    await tx.debtInstallment.update({
      where: { id: current.id },
      data: { status: nextOutstanding.eq(0) ? 'PAID' : 'OPEN' },
    });
    await tx.debt.update({
      where: { id: debt.id },
      data: { remainingAmount: moneyString(remaining), status: debtStatus },
    });
  });

  const updated = await deps.prisma.debt.findUnique({ where: { id: debt.id } });
  if (!updated) {
    throw createNotFoundError('Debt not found.');
  }
  return toView(updated);
};
