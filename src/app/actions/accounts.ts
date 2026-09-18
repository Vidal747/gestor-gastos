'use server';

import { revalidatePath } from 'next/cache';

import { createAccount, deleteAccount, updateAccount } from '@/controllers/accountController';
import { getCurrentUserId } from '@/lib/currentUser';
import { toActionResult } from '@/lib/actionResult';
import { accountStore } from '@/models/stores';

export const createAccountAction = async (formData: FormData) => {
  return toActionResult(async () => {
    const currentUserId = await getCurrentUserId();
    const created = await createAccount(
      {
        name: String(formData.get('name') ?? ''),
        type: (String(formData.get('type') ?? 'CHECKING')) as 'CHECKING' | 'SAVINGS' | 'CASH' | 'CREDIT' | 'INVESTMENT' | 'OTHER',
        currency: String(formData.get('currency') ?? 'COP'),
      },
      currentUserId,
      { prisma: accountStore },
    );
    revalidatePath('/cuentas');
    return { id: created.id };
  });
};

export const updateAccountAction = async (formData: FormData) => {
  return toActionResult(async () => {
    const currentUserId = await getCurrentUserId();
    const updated = await updateAccount(
      String(formData.get('accountId') ?? ''),
      {
        name: String(formData.get('name') ?? '') || undefined,
        type: String(formData.get('type') ?? '') || undefined,
      },
      currentUserId,
      { prisma: accountStore },
    );
    revalidatePath('/cuentas');
    return { id: updated.id };
  });
};

export const deleteAccountAction = async (formData: FormData) => {
  return toActionResult(async () => {
    const currentUserId = await getCurrentUserId();
    await deleteAccount(String(formData.get('accountId') ?? ''), currentUserId, { prisma: accountStore });
    revalidatePath('/cuentas');
    return { id: String(formData.get('accountId') ?? '') };
  });
};
