'use server';

import { revalidatePath } from 'next/cache';

import { addSavingContribution, createSavingGoal } from '@/controllers/savingController';
import { listRelationships } from '@/controllers/relationshipController';
import { createValidationError } from '@/lib/errors';
import { getCurrentUserId } from '@/lib/currentUser';
import { toActionResult } from '@/lib/actionResult';
import { relationshipStore, savingStore } from '@/models/stores';

export const createSavingAction = async (formData: FormData) => {
  return toActionResult(async () => {
    const currentUserId = await getCurrentUserId();
    const participantUserIds = formData.getAll('participantUserIds').map((value) => String(value));
    if (participantUserIds.length > 0) {
      const people = await listRelationships(currentUserId, { prisma: relationshipStore });
      const allowed = new Set(people.map((person) => person.peer.id));
      if (participantUserIds.some((id) => !allowed.has(id))) {
        throw createValidationError('Solo puedes compartir un ahorro con personas que ya vinculaste.');
      }
    }
    const created = await createSavingGoal(
      {
        name: String(formData.get('name') ?? ''),
        description: String(formData.get('description') ?? '') || undefined,
        targetAmount: String(formData.get('targetAmount') ?? ''),
        targetDate: String(formData.get('targetDate') ?? '') || undefined,
        participantUserIds,
      },
      currentUserId,
      { prisma: savingStore },
    );
    revalidatePath('/ahorros');
    return { id: created.id };
  });
};

export const addSavingContributionAction = async (formData: FormData) => {
  return toActionResult(async () => {
    const currentUserId = await getCurrentUserId();
    const updated = await addSavingContribution(
      {
        savingGoalId: String(formData.get('savingGoalId') ?? ''),
        amount: String(formData.get('amount') ?? ''),
        description: String(formData.get('description') ?? '') || undefined,
      },
      currentUserId,
      { prisma: savingStore },
    );
    revalidatePath('/ahorros');
    revalidatePath(`/ahorros/${updated.id}`);
    return { id: updated.id };
  });
};
