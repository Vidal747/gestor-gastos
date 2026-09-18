import Decimal from 'decimal.js';
import { ZodError } from 'zod';

import { createNotFoundError, createValidationError } from '@/lib/errors';
import { toMoney } from '@/lib/finance';
import { createIncomeInputSchema, type CreateIncomeInput } from '@/validations/income';

export type IncomeStore = {
  income: {
    create: (args: {
      data: {
        userId: string;
        description: string;
        category: string;
        amount: string;
        date: Date;
        notes: string | null;
      };
    }) => Promise<PersistedIncome>;
    findUnique: (args: { where: { id: string } }) => Promise<PersistedIncome | null>;
    findMany: (args: { where: { userId: string }; orderBy?: { date: 'desc' | 'asc' } }) => Promise<PersistedIncome[]>;
    update: (args: {
      where: { id: string };
      data: { description?: string; category?: string; amount?: string; date?: Date; notes?: string | null };
    }) => Promise<PersistedIncome>;
    delete: (args: { where: { id: string } }) => Promise<unknown>;
  };
};

export type PersistedIncome = {
  id: string;
  userId: string;
  description: string;
  category: string;
  amount: Decimal | string | number;
  date: Date;
  notes: string | null;
};

export type IncomeView = {
  id: string;
  description: string;
  category: string;
  amount: Decimal;
  date: Date;
  notes: string | null;
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

const moneyString = (value: Decimal | number | string): string => toMoney(value).toFixed(2);

const parseDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    throw createValidationError('La fecha no es válida.');
  }
  return new Date(Date.UTC(year, month - 1, day, 17, 0, 0));
};

const toView = (income: PersistedIncome): IncomeView => ({
  id: income.id,
  description: income.description,
  category: income.category,
  amount: toMoney(income.amount),
  date: income.date,
  notes: income.notes,
});

export const createIncome = async (
  input: CreateIncomeInput,
  currentUserId: string,
  deps: { prisma: IncomeStore },
): Promise<IncomeView> => {
  const parsed = parseOrValidation(() => createIncomeInputSchema.parse(input));
  const created = await deps.prisma.income.create({
    data: {
      userId: currentUserId,
      description: parsed.description,
      category: parsed.category,
      amount: moneyString(parsed.amount),
      date: parseDate(parsed.date),
      notes: parsed.notes?.trim() || null,
    },
  });
  return toView(created);
};

export const listIncomes = async (
  currentUserId: string,
  deps: { prisma: IncomeStore },
): Promise<IncomeView[]> => {
  const rows = await deps.prisma.income.findMany({
    where: { userId: currentUserId },
    orderBy: { date: 'desc' },
  });
  return rows.map(toView);
};

export const getIncome = async (
  incomeId: string,
  currentUserId: string,
  deps: { prisma: IncomeStore },
): Promise<IncomeView> => {
  const income = await deps.prisma.income.findUnique({ where: { id: incomeId } });
  if (!income || income.userId !== currentUserId) {
    throw createNotFoundError('Ingreso no encontrado.');
  }
  return toView(income);
};

export const updateIncome = async (
  incomeId: string,
  input: Partial<CreateIncomeInput>,
  currentUserId: string,
  deps: { prisma: IncomeStore },
): Promise<IncomeView> => {
  const income = await deps.prisma.income.findUnique({ where: { id: incomeId } });
  if (!income || income.userId !== currentUserId) {
    throw createNotFoundError('Ingreso no encontrado.');
  }

  const data: Record<string, unknown> = {};
  if (input.description?.trim()) {
    data.description = input.description.trim();
  }
  if (input.category) {
    data.category = input.category;
  }
  if (input.amount !== undefined) {
    data.amount = moneyString(input.amount);
  }
  if (input.date) {
    data.date = parseDate(input.date);
  }
  if (input.notes !== undefined) {
    data.notes = input.notes?.trim() || null;
  }

  if (Object.keys(data).length === 0) {
    return toView(income);
  }

  const updated = await deps.prisma.income.update({ where: { id: incomeId }, data });
  return toView(updated);
};

export const deleteIncome = async (
  incomeId: string,
  currentUserId: string,
  deps: { prisma: IncomeStore },
): Promise<void> => {
  const income = await deps.prisma.income.findUnique({ where: { id: incomeId } });
  if (!income || income.userId !== currentUserId) {
    throw createNotFoundError('Ingreso no encontrado.');
  }
  await deps.prisma.income.delete({ where: { id: incomeId } });
};

export const monthlyIncomeByCategory = (
  incomes: IncomeView[],
  year: number,
  month: number,
): Map<string, Decimal> => {
  const result = new Map<string, Decimal>();
  for (const income of incomes) {
    if (income.date.getUTCFullYear() === year && income.date.getUTCMonth() + 1 === month) {
      result.set(income.category, (result.get(income.category) ?? new Decimal(0)).plus(income.amount));
    }
  }
  return result;
};

export const totalIncomeForMonth = (
  incomes: IncomeView[],
  year: number,
  month: number,
): Decimal => {
  return incomes
    .filter((i) => i.date.getUTCFullYear() === year && i.date.getUTCMonth() + 1 === month)
    .reduce((sum, i) => sum.plus(i.amount), new Decimal(0));
};
