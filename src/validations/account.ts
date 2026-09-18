import { z } from 'zod';

import { moneySchema } from './finance';

export const createAccountInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(['CHECKING', 'SAVINGS', 'CASH', 'CREDIT', 'INVESTMENT', 'OTHER']),
  currency: z.string().trim().min(1).max(5).default('COP'),
});

export type CreateAccountInput = z.input<typeof createAccountInputSchema>;
