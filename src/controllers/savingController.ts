import Decimal from 'decimal.js';
import { ZodError } from 'zod';

import { createForbiddenError, createNotFoundError, createValidationError } from '@/lib/errors';
import { toMoney } from '@/lib/finance';
import { canonicalUserPair } from '@/lib/relationshipNet';
import {
  addSavingContributionInputSchema,
  createSavingInputSchema,
  type AddSavingContributionInput,
  type CreateSavingInput,
} from '@/validations/saving';

export type SavingStore = {
  user: {
    findUnique: (args: { where: { id: string } }) => Promise<{ id: string; name: string } | null>;
  };
  userConnection: {
    findUnique: (args: {
      where: { lowUserId_highUserId: { lowUserId: string; highUserId: string } };
    }) => Promise<{ id: string } | null>;
  };
  savingGoal: {
    create: (args: {
      data: {
        userId: string;
        name: string;
        description: string | null;
        targetAmount: string;
        targetDate: Date | null;
        status: 'ACTIVE';
        participants: { create: Array<{ userId: string }> };
      };
    }) => Promise<PersistedSaving>;
    findUnique: (args: { where: { id: string } }) => Promise<PersistedSaving | null>;
    findMany: (args: {
      where: { OR: Array<{ userId: string } | { participants: { some: { userId: string } } }> };
    }) => Promise<PersistedSaving[]>;
    update: (args: { where: { id: string }; data: { status?: 'ACTIVE' | 'COMPLETED'; name?: string; description?: string | null; targetAmount?: string; targetDate?: Date | null } }) => Promise<unknown>;
    delete: (args: { where: { id: string } }) => Promise<unknown>;
  };
  savingContribution: {
    create: (args: {
      data: { savingGoalId: string; userId: string; amount: string; description: string | null };
    }) => Promise<unknown>;
  };
};

export type PersistedSaving = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  targetAmount: Decimal | string | number;
  targetDate: Date | null;
  status: string;
  participants: Array<{ userId: string; user?: { id: string; name: string } | null }>;
  contributions: Array<{
    id: string;
    userId: string;
    amount: Decimal | string | number;
    contributionDate: Date;
    description: string | null;
    user?: { id: string; name: string } | null;
  }>;
};

export type SavingView = {
  id: string;
  ownerUserId: string;
  name: string;
  description: string | null;
  targetAmount: Decimal;
  savedAmount: Decimal;
  remainingAmount: Decimal;
  targetDate: Date | null;
  status: string;
  participants: Array<{ id: string; name: string }>;
  contributions: Array<{
    id: string;
    userId: string;
    userName: string;
    amount: Decimal;
    contributionDate: Date;
    description: string | null;
  }>;
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

const canView = (saving: PersistedSaving, currentUserId: string): boolean =>
  saving.userId === currentUserId || saving.participants.some((participant) => participant.userId === currentUserId);

const toView = (saving: PersistedSaving): SavingView => {
  const contributions = [...saving.contributions].sort(
    (left, right) => right.contributionDate.getTime() - left.contributionDate.getTime(),
  );
  const saved = contributions.reduce((sum, item) => sum.plus(toMoney(item.amount)), new Decimal(0));
  const target = toMoney(saving.targetAmount);
  const remaining = toMoney(Decimal.max(target.minus(saved), 0));
  const people = saving.participants.map((participant) => ({
    id: participant.userId,
    name: participant.user?.name ?? 'alguien',
  }));
  return {
    id: saving.id,
    ownerUserId: saving.userId,
    name: saving.name,
    description: saving.description,
    targetAmount: target,
    savedAmount: toMoney(saved),
    remainingAmount: remaining,
    targetDate: saving.targetDate,
    status: saved.gte(target) ? 'COMPLETED' : saving.status,
    participants: people,
    contributions: contributions.map((item) => ({
      id: item.id,
      userId: item.userId,
      userName: item.user?.name ?? 'alguien',
      amount: toMoney(item.amount),
      contributionDate: item.contributionDate,
      description: item.description,
    })),
  };
};

const parseOptionalDate = (value: string | undefined): Date | null => {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    throw createValidationError('La fecha objetivo no es válida.');
  }
  return new Date(Date.UTC(year, month - 1, day, 17, 0, 0));
};

export const createSavingGoal = async (
  input: CreateSavingInput,
  currentUserId: string,
  deps: { prisma: SavingStore },
): Promise<SavingView> => {
  const parsed = parseOrValidation(() => createSavingInputSchema.parse(input));
  const peerIds = [...new Set((parsed.participantUserIds ?? []).filter((id) => id !== currentUserId))];
  for (const peerId of peerIds) {
    const peer = await deps.prisma.user.findUnique({ where: { id: peerId } });
    if (!peer) {
      throw createValidationError('Esa persona no existe.');
    }
    const linked = await deps.prisma.userConnection.findUnique({
      where: { lowUserId_highUserId: canonicalUserPair(currentUserId, peerId) },
    });
    if (!linked) {
      throw createValidationError('Solo puedes compartir un ahorro con personas que ya vinculaste.');
    }
  }

  const created = await deps.prisma.savingGoal.create({
    data: {
      userId: currentUserId,
      name: parsed.name,
      description: parsed.description?.trim() ? parsed.description.trim() : null,
      targetAmount: moneyString(parsed.targetAmount),
      targetDate: parseOptionalDate(parsed.targetDate),
      status: 'ACTIVE',
      participants: { create: [{ userId: currentUserId }, ...peerIds.map((userId) => ({ userId }))] },
    },
  });
  return toView(created);
};

export const listSavingGoals = async (currentUserId: string, deps: { prisma: SavingStore }): Promise<SavingView[]> => {
  const rows = await deps.prisma.savingGoal.findMany({
    where: {
      OR: [{ userId: currentUserId }, { participants: { some: { userId: currentUserId } } }],
    },
  });
  return rows.map(toView).sort((left, right) => left.name.localeCompare(right.name, 'es'));
};

export const getSavingGoal = async (
  savingGoalId: string,
  currentUserId: string,
  deps: { prisma: SavingStore },
): Promise<SavingView> => {
  const saving = await deps.prisma.savingGoal.findUnique({ where: { id: savingGoalId } });
  if (!saving || !canView(saving, currentUserId)) {
    throw createNotFoundError('No encontramos ese ahorro.');
  }
  return toView(saving);
};

export const updateSavingGoal = async (
  savingGoalId: string,
  input: { name?: string; description?: string | null; targetAmount?: string; targetDate?: string | null },
  currentUserId: string,
  deps: { prisma: SavingStore },
): Promise<SavingView> => {
  const saving = await deps.prisma.savingGoal.findUnique({ where: { id: savingGoalId } });
  if (!saving || saving.userId !== currentUserId) {
    throw createNotFoundError('No encontramos ese ahorro.');
  }

  const data: Record<string, unknown> = {};
  if (input.name !== undefined && input.name.trim()) {
    data.name = input.name.trim();
  }
  if (input.description !== undefined) {
    data.description = input.description?.trim() ? input.description.trim() : null;
  }
  if (input.targetAmount !== undefined) {
    data.targetAmount = moneyString(input.targetAmount);
  }
  if (input.targetDate !== undefined) {
    data.targetDate = parseOptionalDate(input.targetDate ?? undefined);
  }

  if (Object.keys(data).length === 0) {
    return toView(saving);
  }

  await deps.prisma.savingGoal.update({ where: { id: savingGoalId }, data });
  return getSavingGoal(savingGoalId, currentUserId, deps);
};

export const deleteSavingGoal = async (
  savingGoalId: string,
  currentUserId: string,
  deps: { prisma: SavingStore },
): Promise<void> => {
  const saving = await deps.prisma.savingGoal.findUnique({ where: { id: savingGoalId } });
  if (!saving || saving.userId !== currentUserId) {
    throw createNotFoundError('No encontramos ese ahorro.');
  }

  const view = toView(saving);
  if (view.savedAmount.gt(0)) {
    throw createValidationError('No se puede eliminar un ahorro con aportes registrados.');
  }

  await deps.prisma.savingGoal.delete({ where: { id: savingGoalId } });
};

export const addSavingContribution = async (
  input: AddSavingContributionInput,
  currentUserId: string,
  deps: { prisma: SavingStore },
): Promise<SavingView> => {
  const parsed = parseOrValidation(() => addSavingContributionInputSchema.parse(input));
  const saving = await deps.prisma.savingGoal.findUnique({ where: { id: parsed.savingGoalId } });
  if (!saving || !canView(saving, currentUserId)) {
    throw createNotFoundError('No encontramos ese ahorro.');
  }
  const isParticipant = saving.participants.some((participant) => participant.userId === currentUserId);
  if (!isParticipant) {
    throw createForbiddenError('No puedes aportar a este ahorro.');
  }

  await deps.prisma.savingContribution.create({
    data: {
      savingGoalId: saving.id,
      userId: currentUserId,
      amount: moneyString(parsed.amount),
      description: parsed.description?.trim() ? parsed.description.trim() : null,
    },
  });

  const view = await getSavingGoal(saving.id, currentUserId, deps);
  if (view.status === 'COMPLETED') {
    await deps.prisma.savingGoal.update({ where: { id: saving.id }, data: { status: 'COMPLETED' } });
  }
  return view;
};
