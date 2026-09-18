import { z } from 'zod';

import { moneySchema } from './finance';

export const calendarDateSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
});

export const debtInstallmentInputSchema = z.object({
  amount: moneySchema,
  dueDate: calendarDateSchema,
});

export const createDebtInputSchema = z
  .object({
    description: z.string().trim().min(1).max(200),
    ownerRole: z.enum(['DEBTOR', 'CREDITOR']),
    counterpartyUserId: z.string().min(1).optional(),
    counterpartyName: z.string().trim().min(1).max(120).optional(),
    originalAmount: moneySchema,
    installments: z.array(debtInstallmentInputSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const hasUser = Boolean(value.counterpartyUserId);
    const hasName = Boolean(value.counterpartyName);
    if (hasUser === hasName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Elige a una persona vinculada o un nombre, no los dos.',
      });
    }
  });

export const payDebtInputSchema = z.object({
  debtId: z.string().min(1),
  amount: moneySchema,
  notes: z.string().trim().max(200).optional(),
});

export const monthlyDebtScheduleSchema = z.object({
  installmentAmount: moneySchema,
  dueDay: z.coerce.number().int().min(1).max(31),
  count: z.coerce.number().int().min(1).max(60),
});

export type CreateDebtInput = z.input<typeof createDebtInputSchema>;
export type PayDebtInput = z.input<typeof payDebtInputSchema>;
export type MonthlyDebtScheduleInput = z.input<typeof monthlyDebtScheduleSchema>;
