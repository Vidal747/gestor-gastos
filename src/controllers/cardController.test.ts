import Decimal from 'decimal.js';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  availableCredit,
  createCard,
  createPurchase,
  getCard,
  payPurchaseInstallment,
  previewPurchase,
  updateCardRate,
  type CardStore,
} from './cardController';

type Payment = { amount: string };
type Installment = {
  id: string;
  installmentNumber: number;
  principalAmount: string;
  interestAmount: string;
  totalAmount: string;
  dueDate: Date;
  remainingBalance: string;
  status: string;
  payments: Payment[];
};
type Purchase = {
  id: string;
  userId: string;
  cardId: string;
  description: string;
  totalAmount: string;
  purchaseDate: Date;
  installments: number;
  status: string;
  installmentsData: Installment[];
};
type Card = {
  id: string;
  userId: string;
  cardholderUserId: string;
  name: string;
  bank: string;
  creditLimit: string;
  annualRate: string;
  cutoffDay: number;
  dueDay: number;
  status: string;
  purchases: Purchase[];
};

const cards = new Map<string, Card>();
let nextId = 1;

let fakePrisma: CardStore;
fakePrisma = {
  $transaction: async (fn) => fn(fakePrisma),
  creditCard: {
    create: async ({ data }: { data: Omit<Card, 'id' | 'purchases'> }) => {
      const card: Card = { id: `card-${nextId}`, ...data, purchases: [] };
      nextId += 1;
      cards.set(card.id, card);
      return structuredClone(card);
    },
    findUnique: async ({ where: { id } }: { where: { id: string } }) => {
      const card = cards.get(id);
      return card ? structuredClone(card) : null;
    },
    findMany: async () => [],
    update: async ({ where: { id }, data }: { where: { id: string }; data: Partial<Card> }) => {
      const card = cards.get(id);
      if (!card) throw new Error('missing card');
      Object.assign(card, data);
      return structuredClone(card);
    },
    delete: async ({ where: { id } }: { where: { id: string } }) => {
      cards.delete(id);
    },
  },
  creditCardPurchase: {
    create: async ({
      data,
    }: {
      data: Omit<Purchase, 'id' | 'installmentsData'> & {
        installmentsData?: { create: Array<Omit<Installment, 'id' | 'payments'>> };
      };
    }) => {
      const card = cards.get(data.cardId);
      if (!card) throw new Error('missing card');
      const purchase: Purchase = {
        id: `purchase-${nextId}`,
        userId: data.userId,
        cardId: data.cardId,
        description: data.description,
        totalAmount: String(data.totalAmount),
        purchaseDate: data.purchaseDate,
        installments: data.installments,
        status: data.status,
        installmentsData: (data.installmentsData?.create ?? []).map((item, index) => ({
          ...item,
          id: `inst-${nextId}-${index + 1}`,
          principalAmount: String(item.principalAmount),
          interestAmount: String(item.interestAmount),
          totalAmount: String(item.totalAmount),
          remainingBalance: String(item.remainingBalance),
          payments: [],
        })),
      };
      nextId += 1;
      card.purchases.push(purchase);
      return structuredClone(purchase);
    },
    findUnique: async ({ where: { id } }: { where: { id: string } }) => {
      for (const card of cards.values()) {
        const purchase = card.purchases.find((item) => item.id === id);
        if (purchase) {
          return structuredClone({ ...purchase, card: structuredClone(card) });
        }
      }
      return null;
    },
    update: async ({ where: { id }, data }: { where: { id: string }; data: Partial<Purchase> }) => {
      for (const card of cards.values()) {
        const purchase = card.purchases.find((item) => item.id === id);
        if (purchase) {
          Object.assign(purchase, data);
          return structuredClone(purchase);
        }
      }
      throw new Error('missing purchase');
    },
  },
  purchaseInstallment: {
    update: async ({
      where: { id },
      data,
    }: {
      where: { id: string };
      data: Partial<Installment>;
    }) => {
      for (const card of cards.values()) {
        for (const purchase of card.purchases) {
          const installment = purchase.installmentsData.find((item) => item.id === id);
          if (installment) {
            Object.assign(installment, data);
            return structuredClone(installment);
          }
        }
      }
      throw new Error('missing installment');
    },
  },
  purchaseInstallmentPayment: {
    create: async ({ data }: { data: { installmentId: string; amount: string } }) => {
      for (const card of cards.values()) {
        for (const purchase of card.purchases) {
          const installment = purchase.installmentsData.find((item) => item.id === data.installmentId);
          if (installment) {
            installment.payments.push({ amount: String(data.amount) });
            return data;
          }
        }
      }
      throw new Error('missing installment');
    },
  },
} as CardStore;

const cardInput = {
  name: 'Visa',
  bank: 'Bancolombia',
  creditLimit: 2_000_000,
  annualRate: 0.24,
  cutoffDay: 5,
  dueDay: 20,
};

describe('cardController', () => {
  beforeEach(() => {
    cards.clear();
    nextId = 1;
  });

  it('previews a french schedule with declining interest', async () => {
    const card = await createCard(cardInput, 'user-a', { prisma: fakePrisma });
    const preview = await previewPurchase(
      {
        cardId: card.id,
        description: 'Nevera',
        totalAmount: 1_200_000,
        purchaseDate: { year: 2026, month: 1, day: 3 },
        installments: 6,
      },
      'user-a',
      { prisma: fakePrisma },
    );
    expect(preview.schedule[0].interest.gt(preview.schedule[5].interest)).toBe(true);
    expect(preview.schedule[0].dueDate).toEqual({ year: 2026, month: 1, day: 20 });
  });

  it('rejects a purchase that exceeds available credit', async () => {
    const card = await createCard(cardInput, 'user-a', { prisma: fakePrisma });
    await expect(
      createPurchase(
        {
          cardId: card.id,
          description: 'Caro',
          totalAmount: 2_000_001,
          purchaseDate: { year: 2026, month: 1, day: 3 },
          installments: 1,
        },
        'user-a',
        { prisma: fakePrisma },
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('creates N installments dated from the cutoff rule', async () => {
    const card = await createCard(cardInput, 'user-a', { prisma: fakePrisma });
    const purchase = await createPurchase(
      {
        cardId: card.id,
        description: 'Nevera',
        totalAmount: 1_200_000,
        purchaseDate: { year: 2026, month: 1, day: 6 },
        installments: 3,
      },
      'user-a',
      { prisma: fakePrisma },
    );
    expect(purchase.installments).toHaveLength(3);
    expect(purchase.installments[0].dueDate.getUTCDate()).toBe(20);
    expect(purchase.installments[0].dueDate.getUTCMonth()).toBe(1);
  });

  it('hides a card from another user', async () => {
    const card = await createCard(cardInput, 'user-a', { prisma: fakePrisma });
    await expect(getCard(card.id, 'user-z', { prisma: fakePrisma })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('rejects paying a later installment while an earlier one is open', async () => {
    const card = await createCard(cardInput, 'user-a', { prisma: fakePrisma });
    const purchase = await createPurchase(
      {
        cardId: card.id,
        description: 'Nevera',
        totalAmount: 1_200_000,
        purchaseDate: { year: 2026, month: 1, day: 3 },
        installments: 3,
      },
      'user-a',
      { prisma: fakePrisma },
    );
    await expect(
      payPurchaseInstallment(
        { purchaseId: purchase.id, installmentId: purchase.installments[1].id, amount: purchase.installments[1].total.toNumber() },
        'user-a',
        { prisma: fakePrisma },
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('rejects an IEA change when an installment has a partial payment', async () => {
    const card = await createCard(cardInput, 'user-a', { prisma: fakePrisma });
    const purchase = await createPurchase(
      {
        cardId: card.id,
        description: 'Nevera',
        totalAmount: 1_200_000,
        purchaseDate: { year: 2026, month: 1, day: 3 },
        installments: 3,
      },
      'user-a',
      { prisma: fakePrisma },
    );
    await payPurchaseInstallment({ purchaseId: purchase.id, amount: 10 }, 'user-a', { prisma: fakePrisma });
    await expect(updateCardRate({ cardId: card.id, annualRate: 0.3 }, 'user-a', { prisma: fakePrisma })).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });

  it('recalculates unpaid installments after a full first payment and IEA change', async () => {
    const card = await createCard(cardInput, 'user-a', { prisma: fakePrisma });
    const purchase = await createPurchase(
      {
        cardId: card.id,
        description: 'Nevera',
        totalAmount: 1_200_000,
        purchaseDate: { year: 2026, month: 1, day: 3 },
        installments: 3,
      },
      'user-a',
      { prisma: fakePrisma },
    );
    const firstTotal = purchase.installments[0].total;
    await payPurchaseInstallment({ purchaseId: purchase.id, amount: firstTotal.toNumber() }, 'user-a', {
      prisma: fakePrisma,
    });
    const updated = await updateCardRate({ cardId: card.id, annualRate: 0.36 }, 'user-a', { prisma: fakePrisma });
    const target = updated.purchases[0];
    expect(target.installments[0].status).toBe('PAID');
    expect(target.installments[0].total.toFixed(2)).toBe(firstTotal.toFixed(2));
    expect(target.installments[1].total.eq(firstTotal)).toBe(false);
  });

  it('reduces available credit by outstanding principal', async () => {
    const card = await createCard(cardInput, 'user-a', { prisma: fakePrisma });
    await createPurchase(
      {
        cardId: card.id,
        description: 'Nevera',
        totalAmount: 1_200_000,
        purchaseDate: { year: 2026, month: 1, day: 3 },
        installments: 3,
      },
      'user-a',
      { prisma: fakePrisma },
    );
    const available = await availableCredit(card.id, 'user-a', { prisma: fakePrisma });
    expect(available.toNumber()).toBe(800_000);
  });
});
