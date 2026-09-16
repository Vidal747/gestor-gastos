import { AppError, createForbiddenError, createValidationError } from '@/lib/errors';
import { distributeAmount, toMoney } from '@/lib/finance';
import { expenseInputSchema } from '@/validations/finance';
import Decimal from 'decimal.js';

export type ExpenseInput = {
  description: string;
  category: string;
  totalAmount: number | string;
  date: Date | string;
  payerUserId: string;
  paymentMethod: string;
  participants: Array<{
    userId: string;
    percentage?: number | string;
    amount?: number | string;
  }>;
};

export const createExpense = (
  input: ExpenseInput,
  currentUserId: string,
): { totalAmount: Decimal; participantBreakdown: Map<string, Decimal> } => {
  const parsed = expenseInputSchema.parse(input);
  validateParticipants(parsed.participants);

  if (parsed.payerUserId !== currentUserId) {
    throw createForbiddenError('Only the payer may create this expense.');
  }

  const total = toMoney(parsed.totalAmount);
  const participantBreakdown = distributeAmount(
    total,
    parsed.participants.map((participant) => ({
      userId: participant.userId,
      share: new Decimal(participant.amount ?? participant.percentage ?? 100 / parsed.participants.length),
    })),
  );

  return { totalAmount: total, participantBreakdown };
};

export const validateParticipants = (participants: ExpenseInput['participants']): void => {
  if (participants.length === 0) {
    throw createValidationError('At least one participant is required.');
  }

  const ids = new Set<string>();

  for (const participant of participants) {
    if (ids.has(participant.userId)) {
      throw createValidationError('Duplicate participants are not allowed.');
    }
    ids.add(participant.userId);
  }

  const hasPercentage = participants.some((participant) => participant.percentage !== undefined);
  const hasAmount = participants.some((participant) => participant.amount !== undefined);

  if (hasPercentage && hasAmount) {
    throw createValidationError('Use either a percentage or a specific amount per participant, not both.');
  }

  if (!hasPercentage && !hasAmount) {
    throw createValidationError('Each participant needs a distribution method.');
  }

  if (hasPercentage) {
    const sum = participants.reduce((total, participant) => total + Number(participant.percentage ?? 0), 0);
    if (Math.abs(sum - 100) > 0.01) {
      throw createValidationError('The sum of percentages must equal 100%.');
    }
  }

  if (hasAmount) {
    const total = participants.reduce((sum, participant) => sum + Number(participant.amount ?? 0), 0);
    if (Number.isNaN(total)) {
      throw createValidationError('The distribution amount values are invalid.');
    }
  }
};

export const getExpenseSummary = (
  input: ExpenseInput,
  currentUserId: string,
): { totalAmount: Decimal; perParticipant: Map<string, Decimal> } => {
  validateParticipants(input.participants);

  try {
    return createExpense(input, currentUserId);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw createValidationError('Unable to generate the expense summary.');
  }
};
