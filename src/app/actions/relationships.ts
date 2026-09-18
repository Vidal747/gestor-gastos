'use server';

import { revalidatePath } from 'next/cache';

import { connectByCode } from '@/controllers/relationshipController';
import { toActionResult } from '@/lib/actionResult';
import { getCurrentUserId } from '@/lib/currentUser';
import { relationshipStore } from '@/models/stores';

export const connectByCodeAction = async (formData: FormData) => {
  const result = await toActionResult(async () => {
    const currentUserId = await getCurrentUserId();
    const connected = await connectByCode(String(formData.get('code') ?? ''), currentUserId, { prisma: relationshipStore });
    return { peerId: connected.peer.id };
  });
  if (result.ok) {
    revalidatePath('/relaciones');
    revalidatePath('/');
    revalidatePath('/deudas');
  }
  return result;
};
