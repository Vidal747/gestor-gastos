'use server';

import { revalidatePath } from 'next/cache';

import { createCard, createPurchase, payPurchaseInstallment, previewPurchase, updateCardRate } from '@/controllers/cardController';
import { getCurrentUserId } from '@/lib/currentUser';
import { toActionResult } from '@/lib/actionResult';
import { cardStore } from '@/models/stores';

const purchaseInputFrom = (formData: FormData) => {
  const purchaseDate = String(formData.get('purchaseDate') ?? '');
  const [year, month, day] = purchaseDate.split('-').map(Number);
  return {
    cardId: String(formData.get('cardId') ?? ''),
    description: String(formData.get('description') ?? ''),
    totalAmount: String(formData.get('totalAmount') ?? ''),
    purchaseDate: { year, month, day },
    installments: Number(formData.get('installments')),
  };
};

export const createCardAction = async (formData: FormData) => {
  return toActionResult(async () => {
    const currentUserId = await getCurrentUserId();
    const created = await createCard(
      {
        name: String(formData.get('name') ?? ''),
        bank: String(formData.get('bank') ?? ''),
        creditLimit: String(formData.get('creditLimit') ?? ''),
        annualRate: Number(formData.get('annualRate')) / 100,
        cutoffDay: Number(formData.get('cutoffDay')),
        dueDay: Number(formData.get('dueDay')),
      },
      currentUserId,
      { prisma: cardStore },
    );
    revalidatePath('/tarjetas');
    return { id: created.id };
  });
};

export const previewPurchaseAction = async (formData: FormData) => {
  return toActionResult(async () => {
    const currentUserId = await getCurrentUserId();
    const preview = await previewPurchase(purchaseInputFrom(formData), currentUserId, { prisma: cardStore });
    return {
      schedule: preview.schedule.map((row) => ({
        installmentNumber: row.installmentNumber,
        principal: row.principal.toFixed(2),
        interest: row.interest.toFixed(2),
        total: row.total.toFixed(2),
        remainingBalance: row.remainingBalance.toFixed(2),
        dueDate: row.dueDate,
      })),
    };
  });
};

export const createPurchaseAction = async (formData: FormData) => {
  return toActionResult(async () => {
    const currentUserId = await getCurrentUserId();
    const created = await createPurchase(purchaseInputFrom(formData), currentUserId, { prisma: cardStore });
    revalidatePath(`/tarjetas/${created.cardId}`);
    revalidatePath('/proximos');
    return { id: created.id, cardId: created.cardId };
  });
};

export const payPurchaseAction = async (formData: FormData) => {
  return toActionResult(async () => {
    const currentUserId = await getCurrentUserId();
    const paid = await payPurchaseInstallment(
      {
        purchaseId: String(formData.get('purchaseId') ?? ''),
        amount: String(formData.get('amount') ?? ''),
        notes: String(formData.get('notes') ?? '') || undefined,
      },
      currentUserId,
      { prisma: cardStore },
    );
    revalidatePath(`/tarjetas/${paid.cardId}`);
    revalidatePath(`/tarjetas/${paid.cardId}/compras/${paid.id}`);
    revalidatePath('/proximos');
    return { id: paid.id, cardId: paid.cardId };
  });
};

export const updateCardRateAction = async (formData: FormData) => {
  return toActionResult(async () => {
    const currentUserId = await getCurrentUserId();
    const updated = await updateCardRate(
      {
        cardId: String(formData.get('cardId') ?? ''),
        annualRate: Number(formData.get('annualRate')) / 100,
      },
      currentUserId,
      { prisma: cardStore },
    );
    revalidatePath(`/tarjetas/${updated.id}`);
    revalidatePath('/proximos');
    return { id: updated.id };
  });
};
