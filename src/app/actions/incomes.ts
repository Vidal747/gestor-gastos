'use server';

import { revalidatePath } from 'next/cache';

import { createIncome, deleteIncome, listIncomes, updateIncome } from '@/controllers/incomeController';
import { getCurrentUserId } from '@/lib/currentUser';
import { toActionResult } from '@/lib/actionResult';
import { incomeStore } from '@/models/stores';

export const createIncomeAction = async (formData: FormData) => {
  return toActionResult(async () => {
    const currentUserId = await getCurrentUserId();
    const created = await createIncome(
      {
        description: String(formData.get('description') ?? ''),
        category: (String(formData.get('category') ?? 'SALARY')) as 'SALARY' | 'FREELANCE' | 'REFUND' | 'SALE' | 'EXTRA' | 'OTHER',
        amount: String(formData.get('amount') ?? ''),
        date: String(formData.get('date') ?? ''),
        notes: String(formData.get('notes') ?? '') || undefined,
      },
      currentUserId,
      { prisma: incomeStore },
    );
    revalidatePath('/ingresos');
    return { id: created.id };
  });
};

export const updateIncomeAction = async (formData: FormData) => {
  return toActionResult(async () => {
    const currentUserId = await getCurrentUserId();
    const updated = await updateIncome(
      String(formData.get('incomeId') ?? ''),
      {
        description: String(formData.get('description') ?? '') || undefined,
        category: (String(formData.get('category') ?? '') || undefined) as 'SALARY' | 'FREELANCE' | 'REFUND' | 'SALE' | 'EXTRA' | 'OTHER' | undefined,
        amount: String(formData.get('amount') ?? '') || undefined,
        date: String(formData.get('date') ?? '') || undefined,
        notes: String(formData.get('notes') ?? '') || undefined,
      },
      currentUserId,
      { prisma: incomeStore },
    );
    revalidatePath('/ingresos');
    return { id: updated.id };
  });
};

export const deleteIncomeAction = async (formData: FormData) => {
  return toActionResult(async () => {
    const currentUserId = await getCurrentUserId();
    await deleteIncome(String(formData.get('incomeId') ?? ''), currentUserId, { prisma: incomeStore });
    revalidatePath('/ingresos');
    return { id: String(formData.get('incomeId') ?? '') };
  });
};
