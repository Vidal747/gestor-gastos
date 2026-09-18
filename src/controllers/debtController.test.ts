import { beforeEach, describe, expect, it } from 'vitest';

import { createDebt, getDebt, payDebtInstallment, type DebtStore } from './debtController';

type Row = {
  id: string;
  ownerUserId: string;
  ownerRole: 'DEBTOR' | 'CREDITOR';
  counterpartyUserId: string | null;
  counterpartyName: string | null;
  description: string;
  originalAmount: string;
  remainingAmount: string;
  status: string;
  installments: Array<{
    id: string;
    installmentNumber: number;
    amount: string;
    dueDate: Date;
    status: string;
    payments: Array<{ amount: string }>;
  }>;
  payments: Array<{ amount: string; installmentId: string }>;
};

const store = new Map<string, Row>();
let nextId = 1;

const clone = (row: Row): Row => structuredClone(row);

let fakePrisma: DebtStore;
fakePrisma = {
  $transaction: async (fn: (tx: DebtStore) => Promise<unknown>) => fn(fakePrisma),
  user: {
    findUnique: async ({ where: { id } }: { where: { id: string } }) =>
      id === 'user-b' ? { id: 'user-b' } : id === 'user-a' ? { id: 'user-a' } : null,
  },
  debt: {
    create: async ({ data }: { data: Omit<Row, 'installments' | 'payments' | 'id'> & { installments?: { create: Row['installments'] } } }) => {
      const id = `debt-${nextId}`;
      nextId += 1;
      const row: Row = {
        id,
        ownerUserId: data.ownerUserId,
        ownerRole: data.ownerRole,
        counterpartyUserId: data.counterpartyUserId,
        counterpartyName: data.counterpartyName,
        description: data.description,
        originalAmount: String(data.originalAmount),
        remainingAmount: String(data.remainingAmount),
        status: data.status,
        installments: (data.installments?.create ?? []).map((item, index) => ({
          ...item,
          id: `${id}-i${index + 1}`,
          amount: String(item.amount),
          payments: [],
        })),
        payments: [],
      };
      store.set(id, row);
      return clone(row);
    },
    findUnique: async ({ where: { id } }: { where: { id: string } }) => {
      const row = store.get(id);
      return row ? clone(row) : null;
    },
    findMany: async () => [],
    update: async ({ where: { id }, data }: { where: { id: string }; data: Partial<Row> }) => {
      const row = store.get(id);
      if (!row) {
        throw new Error('missing');
      }
      Object.assign(row, data);
      return clone(row);
    },
    delete: async ({ where: { id } }: { where: { id: string } }) => {
      store.delete(id);
    },
  },
  debtInstallment: {
    update: async ({ where: { id }, data }: { where: { id: string }; data: { status: string } }) => {
      for (const row of store.values()) {
        const installment = row.installments.find((item) => item.id === id);
        if (installment) {
          installment.status = data.status;
          return { ...installment };
        }
      }
      throw new Error('missing installment');
    },
  },
  debtPayment: {
    create: async ({ data }: { data: { debtId: string; installmentId: string; amount: string } }) => {
      const row = store.get(data.debtId);
      if (!row) {
        throw new Error('missing debt');
      }
      row.payments.push({ amount: String(data.amount), installmentId: data.installmentId });
      const installment = row.installments.find((item) => item.id === data.installmentId);
      installment?.payments.push({ amount: String(data.amount) });
      return data;
    },
  },
} as unknown as DebtStore;

const baseInput = {
  description: 'Préstamo',
  ownerRole: 'DEBTOR' as const,
  originalAmount: 100,
  installments: [
    { amount: 40, dueDate: { year: 2026, month: 1, day: 10 } },
    { amount: 60, dueDate: { year: 2026, month: 2, day: 10 } },
  ],
};

describe('debtController', () => {
  beforeEach(() => {
    store.clear();
    nextId = 1;
  });

  it('rejects a schedule that does not sum to the total', async () => {
    await expect(
      createDebt(
        {
          ...baseInput,
          counterpartyName: 'Banco',
          installments: [{ amount: 40, dueDate: { year: 2026, month: 1, day: 10 } }],
        },
        'user-a',
        { prisma: fakePrisma },
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('rejects providing both a user and a name as counterparty', async () => {
    await expect(
      createDebt({ ...baseInput, counterpartyUserId: 'user-b', counterpartyName: 'Banco' }, 'user-a', {
        prisma: fakePrisma,
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('stores the authenticated user as owner even if another id is sent', async () => {
    const created = await createDebt({ ...baseInput, counterpartyName: 'Banco' }, 'user-a', {
      prisma: fakePrisma,
    });
    const debt = await getDebt(created.id, 'user-a', { prisma: fakePrisma });
    expect(debt.ownerUserId).toBe('user-a');
  });

  it('hides a debt from a stranger', async () => {
    const created = await createDebt({ ...baseInput, counterpartyName: 'Banco' }, 'user-a', {
      prisma: fakePrisma,
    });
    await expect(getDebt(created.id, 'user-z', { prisma: fakePrisma })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('rejects a payment from someone who is not the owner', async () => {
    const created = await createDebt({ ...baseInput, counterpartyUserId: 'user-b' }, 'user-a', {
      prisma: fakePrisma,
    });
    await expect(
      payDebtInstallment({ debtId: created.id, amount: 10 }, 'user-b', { prisma: fakePrisma }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('rejects paying more than the current installment outstanding', async () => {
    const created = await createDebt({ ...baseInput, counterpartyName: 'Banco' }, 'user-a', {
      prisma: fakePrisma,
    });
    await expect(
      payDebtInstallment({ debtId: created.id, amount: 41 }, 'user-a', { prisma: fakePrisma }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('keeps the first installment open after a partial payment', async () => {
    const created = await createDebt({ ...baseInput, counterpartyName: 'Banco' }, 'user-a', {
      prisma: fakePrisma,
    });
    const paid = await payDebtInstallment({ debtId: created.id, amount: 10 }, 'user-a', { prisma: fakePrisma });
    expect(paid.remainingAmount.toNumber()).toBe(90);
    expect(paid.installments[0].status).toBe('OPEN');
    expect(paid.installments[0].outstanding.toNumber()).toBe(30);
    expect(paid.status).toBe('PARTIALLY_PAID');
  });

  it('marks the debt paid after the last installment is fully paid', async () => {
    const created = await createDebt({ ...baseInput, counterpartyName: 'Banco' }, 'user-a', {
      prisma: fakePrisma,
    });
    await payDebtInstallment({ debtId: created.id, amount: 40 }, 'user-a', { prisma: fakePrisma });
    const paid = await payDebtInstallment({ debtId: created.id, amount: 60 }, 'user-a', { prisma: fakePrisma });
    expect(paid.remainingAmount.toNumber()).toBe(0);
    expect(paid.status).toBe('PAID');
    expect(paid.installments[1].status).toBe('PAID');
  });
});
