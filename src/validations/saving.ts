import { z } from 'zod';

import { moneySchema } from './finance';

export const createSavingInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(200).optional(),
  targetAmount: moneySchema,
  targetDate: z.string().trim().optional(),
  participantUserIds: z.array(z.string().min(1)).optional(),
});

export const addSavingContributionInputSchema = z.object({
  savingGoalId: z.string().min(1),
  amount: moneySchema,
  description: z.string().trim().max(200).optional(),
});

export type CreateSavingInput = z.input<typeof createSavingInputSchema>;
export type AddSavingContributionInput = z.input<typeof addSavingContributionInputSchema>;
