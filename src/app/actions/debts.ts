'use server';

import { revalidatePath } from 'next/cache';

import { createValidationError } from '@/lib/errors';
import { listRelationships } from '@/controllers/relationshipController';
import { createDebt, payDebtInstallment } from '@/controllers/debtController';
import { getCurrentUserId } from '@/lib/currentUser';
import { toActionResult } from '@/lib/actionResult';
import { buildMonthlyDebtSchedule, toCalendarDate, toMoney } from '@/lib/finance';
import { debtStore, relationshipStore } from '@/models/stores';
import { monthlyDebtScheduleSchema } from '@/validations/debt';

const parseInstallments = (formData: FormData) => {
  const amounts = formData.getAll('installmentAmount');
  const dues = formData.getAll('installmentDue');
  return amounts.map((amount, index) => {
    const due = String(dues[index] ?? '');
    const [year, month, day] = due.split('-').map(Number);
    return {
      amount: String(amount),
      dueDate: { year, month, day },
    };
  });
};

export const createDebtAction = async (formData: FormData) => {
  return toActionResult(async () => {
    const currentUserId = await getCurrentUserId();
    const counterpartyUserId = String(formData.get('counterpartyUserId') ?? '').trim();
    const counterpartyName = String(formData.get('counterpartyName') ?? '').trim();
    if (counterpartyUserId) {
      const people = await listRelationships(currentUserId, { prisma: relationshipStore });
      if (!people.some((person) => person.peer.id === counterpartyUserId)) {
        throw createValidationError('Solo puedes crear deudas con personas que ya vinculaste.');
      }
    }
    const scheduleKind = String(formData.get('scheduleKind') ?? 'manual');
    const installments =
      scheduleKind === 'monthly'
        ? (() => {
            const parsed = monthlyDebtScheduleSchema.safeParse({
              installmentAmount: String(formData.get('installmentAmount') ?? ''),
              dueDay: String(formData.get('dueDay') ?? ''),
              count: String(formData.get('count') ?? ''),
            });
            if (!parsed.success) {
              throw createValidationError(parsed.error.issues[0]?.message ?? 'Revisa el cobro mensual.');
            }
            const rows = buildMonthlyDebtSchedule({
              amount: parsed.data.installmentAmount,
              dueDay: parsed.data.dueDay,
              count: parsed.data.count,
              from: toCalendarDate(new Date()),
            });
            return rows.map((row) => ({ amount: row.amount.toFixed(2), dueDate: row.dueDate }));
          })()
        : parseInstallments(formData);
    if (installments.length < 1) {
      throw createValidationError('Agrega al menos una cuota.');
    }
    const originalAmount =
      scheduleKind === 'monthly'
        ? installments.reduce((sum, row) => sum.plus(toMoney(row.amount)), toMoney(0)).toFixed(2)
        : String(formData.get('originalAmount') ?? '');
    const created = await createDebt(
      {
        description: String(formData.get('description') ?? ''),
        ownerRole: String(formData.get('ownerRole') ?? 'DEBTOR') === 'CREDITOR' ? 'CREDITOR' : 'DEBTOR',
        counterpartyUserId: counterpartyUserId || undefined,
        counterpartyName: counterpartyName || undefined,
        originalAmount,
        installments,
      },
      currentUserId,
      { prisma: debtStore },
    );
    revalidatePath('/deudas');
    revalidatePath('/proximos');
    revalidatePath('/relaciones');
    return { id: created.id };
  });
};

export const payDebtAction = async (formData: FormData) => {
  return toActionResult(async () => {
    const currentUserId = await getCurrentUserId();
    const paid = await payDebtInstallment(
      {
        debtId: String(formData.get('debtId') ?? ''),
        amount: String(formData.get('amount') ?? ''),
        notes: String(formData.get('notes') ?? '') || undefined,
      },
      currentUserId,
      { prisma: debtStore },
    );
    revalidatePath('/deudas');
    revalidatePath(`/deudas/${paid.id}`);
    revalidatePath('/proximos');
    revalidatePath('/relaciones');
    return { id: paid.id };
  });
};
