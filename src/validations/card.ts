import { z } from 'zod';

import { moneySchema } from './finance';
import { calendarDateSchema } from './debt';

export const createCardInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  bank: z.string().trim().min(1).max(80),
  creditLimit: moneySchema,
  annualRate: z.union([z.number(), z.string()]).refine((value) => Number(value) >= 0, {
    message: 'The annual rate cannot be negative.',
  }),
  cutoffDay: z.number().int().min(1).max(28),
  dueDay: z.number().int().min(1).max(28),
});

export const previewPurchaseInputSchema = z.object({
  cardId: z.string().min(1),
  description: z.string().trim().min(1).max(200),
  totalAmount: moneySchema,
  purchaseDate: calendarDateSchema,
  installments: z.number().int().min(1).max(60),
});

export const payPurchaseInputSchema = z.object({
  purchaseId: z.string().min(1),
  installmentId: z.string().min(1).optional(),
  amount: moneySchema,
  notes: z.string().trim().max(200).optional(),
});

export const updateCardRateInputSchema = z.object({
  cardId: z.string().min(1),
  annualRate: z.union([z.number(), z.string()]).refine((value) => Number(value) >= 0, {
    message: 'The annual rate cannot be negative.',
  }),
});

export type CreateCardInput = z.input<typeof createCardInputSchema>;
export type PreviewPurchaseInput = z.input<typeof previewPurchaseInputSchema>;
export type PayPurchaseInput = z.input<typeof payPurchaseInputSchema>;
export type UpdateCardRateInput = z.input<typeof updateCardRateInputSchema>;
