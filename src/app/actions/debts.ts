'use server';

import { revalidatePath } from 'next/cache';

import { createValidationError } from '@/lib/errors';
import { listRelationships } from '@/controllers/relationshipController';
import { createDebt, payDebtInstallment } from '@/controllers/debtController';
import { getCurrentUserId } from '@/lib/currentUser';
import { toActionResult } from '@/lib/actionResult';
import { debtStore, relationshipStore } from '@/models/stores';

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
    const created = await createDebt(
      {
        description: String(formData.get('description') ?? ''),
        ownerRole: String(formData.get('ownerRole') ?? 'DEBTOR') === 'CREDITOR' ? 'CREDITOR' : 'DEBTOR',
        counterpartyUserId: counterpartyUserId || undefined,
        counterpartyName: counterpartyName || undefined,
        originalAmount: String(formData.get('originalAmount') ?? ''),
        installments: parseInstallments(formData),
      },
      currentUserId,
      { prisma: debtStore },
    );
    revalidatePath('/deudas');
    revalidatePath('/proximos');
    revalidatePath('/relaciones');
    return created;
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
    return paid;
  });
};
