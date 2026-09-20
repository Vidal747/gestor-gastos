import { z } from 'zod';

import { normalizeMoneyString } from '@/lib/finance';

export const moneySchema = z
  .union([z.number(), z.string()])
  .transform((value) => (typeof value === 'string' ? normalizeMoneyString(value) : value))
  .refine((value) => Number(value) > 0, {
    message: 'El valor debe ser mayor que cero.',
  });

export const percentageSchema = z.union([z.number(), z.string()]).refine((value) => Number(value) >= 0 && Number(value) <= 100, {
  message: 'The percentage must be between 0 and 100.',
});

export const participantSchema = z.object({
  userId: z.string().min(1, 'Participant ID is required.'),
  percentage: z.number().min(0).max(100).optional(),
  amount: z.number().min(0).optional(),
});

export const expenseInputSchema = z.object({
  description: z.string().min(1),
  category: z.string().min(1),
  totalAmount: moneySchema,
  date: z.coerce.date(),
  payerUserId: z.string().min(1),
  paymentMethod: z.string().min(1),
  participants: z.array(participantSchema).min(1),
});

export const debtInputSchema = z.object({
  creditorUserId: z.string().min(1),
  debtorUserId: z.string().min(1),
  description: z.string().min(1),
  originalAmount: moneySchema,
  dueDate: z.coerce.date().optional(),
});
