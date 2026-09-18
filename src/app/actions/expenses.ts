'use server';

import { revalidatePath } from 'next/cache';

import { createExpense, getExpenseSummary, validateParticipants } from '@/controllers/expenseController';
import { createValidationError } from '@/lib/errors';
import { getCurrentUserId } from '@/lib/currentUser';
import { toActionResult } from '@/lib/actionResult';

export const createExpenseAction = async (formData: FormData) => {
  return toActionResult(async () => {
    const currentUserId = await getCurrentUserId();
    const participantIds = formData.getAll('participantUserIds').map((v) => String(v));
    const participantPercentages = formData.getAll('participantPercentages').map((v) => Number(v));
    const participantAmounts = formData.getAll('participantAmounts').map((v) => Number(v));

    if (participantIds.length === 0) {
      throw createValidationError('Agregá al menos un participante.');
    }

    const participants = participantIds.map((userId, i) => ({
      userId,
      percentage: participantPercentages[i] || undefined,
      amount: participantAmounts[i] || undefined,
    }));

    const result = createExpense(
      {
        description: String(formData.get('description') ?? ''),
        category: String(formData.get('category') ?? 'FOOD'),
        totalAmount: String(formData.get('totalAmount') ?? ''),
        date: new Date(String(formData.get('date') ?? Date.now())),
        payerUserId: currentUserId,
        paymentMethod: String(formData.get('paymentMethod') ?? 'CASH'),
        participants,
      },
      currentUserId,
    );

    revalidatePath('/gastos');
    return {
      totalAmount: result.totalAmount.toFixed(2),
      participants: participants.map((p, i) => ({
        userId: p.userId,
        amount: result.participantBreakdown.get(p.userId)?.toFixed(2) ?? '0.00',
      })),
    };
  });
};
