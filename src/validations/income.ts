import { z } from 'zod';

import { moneySchema } from './finance';

export const createIncomeInputSchema = z.object({
  description: z.string().trim().min(1).max(200),
  category: z.enum(['SALARY', 'FREELANCE', 'REFUND', 'SALE', 'EXTRA', 'OTHER']),
  amount: moneySchema,
  date: z.string().trim(),
  notes: z.string().trim().max(500).optional(),
});

export type CreateIncomeInput = z.input<typeof createIncomeInputSchema>;
