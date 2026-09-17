import { describe, expect, it } from 'vitest';

import { listUpcoming } from './upcomingController';
import type { CardStore } from './cardController';
import type { DebtStore } from './debtController';

describe('upcomingController', () => {
  it('merges debt and card installments and sorts them by due date', async () => {
    const debts = {
      debt: {
        findMany: async () => [
          {
            id: 'd1',
            ownerUserId: 'user-a',
            ownerRole: 'DEBTOR' as const,
            counterpartyUserId: null,
            counterpartyName: 'Banco',
            description: 'Préstamo',
            originalAmount: '100',
            remainingAmount: '100',
            status: 'PENDING',
            installments: [
              {
                id: 'di1',
                installmentNumber: 1,
                amount: '100',
                dueDate: new Date('2026-03-10T17:00:00.000Z'),
                status: 'OPEN',
                payments: [],
              },
            ],
            payments: [],
          },
        ],
      },
    } as unknown as DebtStore;
    const cards = {
      creditCard: {
        findMany: async () => [
          {
            id: 'c1',
            userId: 'user-a',
            cardholderUserId: 'user-a',
            name: 'Visa',
            bank: 'Bancolombia',
            creditLimit: '2000000',
            annualRate: '0.24',
            cutoffDay: 5,
            dueDay: 20,
            status: 'ACTIVE',
            purchases: [
              {
                id: 'p1',
                userId: 'user-a',
                cardId: 'c1',
                description: 'Nevera',
                totalAmount: '1200000',
                purchaseDate: new Date('2026-01-03T17:00:00.000Z'),
                installments: 1,
                status: 'OPEN',
                installmentsData: [
                  {
                    id: 'ci1',
                    installmentNumber: 1,
                    principalAmount: '400000',
                    interestAmount: '20000',
                    totalAmount: '420000',
                    dueDate: new Date('2026-02-20T17:00:00.000Z'),
                    remainingBalance: '800000',
                    status: 'OPEN',
                    payments: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    } as unknown as CardStore;

    const items = await listUpcoming('user-a', { debts, cards });
    expect(items).toHaveLength(2);
    expect(items[0].kind).toBe('card');
    expect(items[1].kind).toBe('debt');
    expect(items[0].href).toContain('/tarjetas/');
  });
});
