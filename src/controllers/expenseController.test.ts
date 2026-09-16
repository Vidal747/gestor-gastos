import { describe, expect, it } from 'vitest';

import { createExpense } from './expenseController';

describe('expense controller', () => {
  it('preserves explicit participant amounts when creating an expense', () => {
    const result = createExpense(
      {
        description: 'Shared groceries',
        category: 'FOOD',
        totalAmount: '1000',
        date: '2026-09-16',
        payerUserId: 'user-a',
        paymentMethod: 'CASH',
        participants: [
          { userId: 'user-a', amount: 300 },
          { userId: 'user-b', amount: 700 },
        ],
      },
      'user-a',
    );

    expect(result.participantBreakdown.get('user-a')?.toNumber()).toBe(300);
    expect(result.participantBreakdown.get('user-b')?.toNumber()).toBe(700);
  });
});