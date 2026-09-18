import Decimal from 'decimal.js';
import { ZodError } from 'zod';

import { createConflictError, createNotFoundError, createValidationError } from '@/lib/errors';
import {
  calculateInstallments,
  firstInstallmentDueDate,
  fromCalendarDate,
  installmentDueDates,
  installmentOutstanding,
  recalcOpenFrenchInstallments,
  remainingPrincipalAfterPaid,
  toMoney,
  type CalendarDate,
  type RecalcInstallmentInput,
} from '@/lib/finance';
import {
  createCardInputSchema,
  payPurchaseInputSchema,
  previewPurchaseInputSchema,
  updateCardRateInputSchema,
  type CreateCardInput,
  type PayPurchaseInput,
  type PreviewPurchaseInput,
  type UpdateCardRateInput,
} from '@/validations/card';

export type CardStore = {
  $transaction: <T>(fn: (tx: CardStore) => Promise<T>) => Promise<T>;
  creditCard: {
    create: (args: {
      data: {
        userId: string;
        cardholderUserId: string;
        name: string;
        bank: string;
        creditLimit: string;
        annualRate: string;
        cutoffDay: number;
        dueDay: number;
        status: 'ACTIVE';
      };
    }) => Promise<PersistedCard>;
    findUnique: (args: { where: { id: string } }) => Promise<PersistedCard | null>;
    findMany: (args: { where: { userId: string } }) => Promise<PersistedCard[]>;
    update: (args: { where: { id: string }; data: { annualRate?: string; name?: string; bank?: string; creditLimit?: string; cutoffDay?: number; dueDay?: number } }) => Promise<PersistedCard>;
    delete: (args: { where: { id: string } }) => Promise<unknown>;
  };
  creditCardPurchase: {
    create: (args: {
      data: {
        userId: string;
        cardId: string;
        description: string;
        totalAmount: string;
        purchaseDate: Date;
        installments: number;
        status: 'OPEN';
        installmentsData: {
          create: Array<{
            installmentNumber: number;
            principalAmount: string;
            interestAmount: string;
            totalAmount: string;
            dueDate: Date;
            remainingBalance: string;
            status: 'OPEN';
          }>;
        };
      };
    }) => Promise<PersistedPurchase>;
    findUnique: (args: { where: { id: string } }) => Promise<(PersistedPurchase & { card: PersistedCard }) | null>;
    update: (args: { where: { id: string }; data: { status: 'OPEN' | 'PARTIALLY_PAID' | 'PAID' } }) => Promise<unknown>;
  };
  purchaseInstallment: {
    update: (args: {
      where: { id: string };
      data: {
        status?: 'OPEN' | 'PAID';
        principalAmount?: string;
        interestAmount?: string;
        totalAmount?: string;
        remainingBalance?: string;
      };
    }) => Promise<unknown>;
  };
  purchaseInstallmentPayment: {
    create: (args: { data: { installmentId: string; amount: string; notes?: string } }) => Promise<unknown>;
  };
};

export type PersistedInstallment = {
  id: string;
  installmentNumber: number;
  principalAmount: Decimal | string | number;
  interestAmount: Decimal | string | number;
  totalAmount: Decimal | string | number;
  dueDate: Date;
  remainingBalance: Decimal | string | number;
  status: string;
  payments?: Array<{ amount: Decimal | string | number }>;
};

export type PersistedPurchase = {
  id: string;
  userId: string;
  cardId: string;
  description: string;
  totalAmount: Decimal | string | number;
  purchaseDate: Date;
  installments: number;
  status: string;
  installmentsData: PersistedInstallment[];
};

export type PersistedCard = {
  id: string;
  userId: string;
  cardholderUserId: string;
  name: string;
  bank: string;
  creditLimit: Decimal | string | number;
  annualRate: Decimal | string | number;
  cutoffDay: number;
  dueDay: number;
  status: string;
  purchases: PersistedPurchase[];
};

export type InstallmentView = {
  id: string;
  installmentNumber: number;
  principal: Decimal;
  interest: Decimal;
  total: Decimal;
  outstanding: Decimal;
  remainingBalance: Decimal;
  dueDate: Date;
  status: string;
};

export type PurchaseView = {
  id: string;
  cardId: string;
  description: string;
  totalAmount: Decimal;
  status: string;
  installments: InstallmentView[];
};

export type CardView = {
  id: string;
  name: string;
  bank: string;
  creditLimit: Decimal;
  annualRate: Decimal;
  cutoffDay: number;
  dueDay: number;
  availableCredit: Decimal;
  purchases: PurchaseView[];
};

const parseOrValidation = <T>(parse: () => T): T => {
  try {
    return parse();
  } catch (error) {
    if (error instanceof ZodError) {
      throw createValidationError(error.issues[0]?.message ?? 'Invalid input.');
    }
    throw error;
  }
};

const moneyString = (value: Decimal | number | string): string => toMoney(value).toFixed(2);

const toInstallmentView = (item: PersistedInstallment): InstallmentView => {
  const total = toMoney(item.totalAmount);
  const outstanding = installmentOutstanding(total, (item.payments ?? []).map((payment) => payment.amount));
  return {
    id: item.id,
    installmentNumber: item.installmentNumber,
    principal: toMoney(item.principalAmount),
    interest: toMoney(item.interestAmount),
    total,
    outstanding,
    remainingBalance: toMoney(item.remainingBalance),
    dueDate: item.dueDate,
    status: outstanding.eq(0) ? 'PAID' : item.status,
  };
};

const toPurchaseView = (purchase: PersistedPurchase): PurchaseView => {
  const installments = [...purchase.installmentsData]
    .sort((left, right) => left.installmentNumber - right.installmentNumber)
    .map(toInstallmentView);
  const remaining = installments.reduce((sum, item) => sum.plus(item.outstanding), new Decimal(0));
  return {
    id: purchase.id,
    cardId: purchase.cardId,
    description: purchase.description,
    totalAmount: toMoney(purchase.totalAmount),
    status: remaining.eq(0) ? 'PAID' : remaining.lt(toMoney(purchase.totalAmount)) ? 'PARTIALLY_PAID' : purchase.status,
    installments,
  };
};

const purchasePrincipalUsed = (purchase: PersistedPurchase): Decimal => {
  if (purchase.status === 'PAID' || purchase.status === 'CANCELLED') {
    return new Decimal(0);
  }
  const paid = [...(purchase.installmentsData ?? [])]
    .filter((item) => toInstallmentView(item).status === 'PAID')
    .sort((left, right) => left.installmentNumber - right.installmentNumber);
  if (paid.length === 0) {
    return toMoney(purchase.totalAmount);
  }
  return remainingPrincipalAfterPaid(
    purchase.totalAmount,
    purchase.installmentsData.map((item) => ({
      installmentNumber: item.installmentNumber,
      dueDate: { year: item.dueDate.getUTCFullYear(), month: item.dueDate.getUTCMonth() + 1, day: item.dueDate.getUTCDate() },
      status: toInstallmentView(item).status === 'PAID' ? 'PAID' : 'OPEN',
      remainingBalance: toMoney(item.remainingBalance),
      hasPayments: (item.payments ?? []).length > 0,
    })),
  );
};

const computeAvailableCredit = (card: PersistedCard): Decimal => {
  const used = (card.purchases ?? []).reduce((sum, purchase) => sum.plus(purchasePrincipalUsed(purchase)), new Decimal(0));
  return toMoney(card.creditLimit).minus(used);
};

const toCardView = (card: PersistedCard): CardView => ({
  id: card.id,
  name: card.name,
  bank: card.bank,
  creditLimit: toMoney(card.creditLimit),
  annualRate: new Decimal(card.annualRate),
  cutoffDay: card.cutoffDay,
  dueDay: card.dueDay,
  availableCredit: computeAvailableCredit(card),
  purchases: (card.purchases ?? []).map(toPurchaseView),
});

const loadOwnedCard = async (cardId: string, currentUserId: string, prisma: CardStore): Promise<PersistedCard> => {
  const card = await prisma.creditCard.findUnique({ where: { id: cardId } });
  if (!card || card.userId !== currentUserId) {
    throw createNotFoundError('Credit card not found.');
  }
  return card;
};

const buildSchedule = (
  card: Pick<PersistedCard, 'annualRate' | 'cutoffDay' | 'dueDay'>,
  totalAmount: Decimal | number | string,
  purchaseDate: CalendarDate,
  count: number,
) => {
  const firstDue = firstInstallmentDueDate(purchaseDate, card.cutoffDay, card.dueDay);
  const dates = installmentDueDates(firstDue, count);
  const rows = calculateInstallments(totalAmount, count, card.annualRate);
  return rows.map((row, index) => ({
    ...row,
    dueDate: dates[index],
  }));
};

export const createCard = async (
  input: CreateCardInput,
  currentUserId: string,
  deps: { prisma: CardStore },
): Promise<CardView> => {
  const parsed = parseOrValidation(() => createCardInputSchema.parse(input));
  const created = await deps.prisma.creditCard.create({
    data: {
      userId: currentUserId,
      cardholderUserId: currentUserId,
      name: parsed.name,
      bank: parsed.bank,
      creditLimit: moneyString(parsed.creditLimit),
      annualRate: new Decimal(parsed.annualRate).toString(),
      cutoffDay: parsed.cutoffDay,
      dueDay: parsed.dueDay,
      status: 'ACTIVE',
    },
  });
  return toCardView({ ...created, purchases: created.purchases ?? [] });
};

export const listCards = async (currentUserId: string, deps: { prisma: CardStore }): Promise<CardView[]> => {
  const rows = await deps.prisma.creditCard.findMany({ where: { userId: currentUserId } });
  return rows.map(toCardView);
};

export const getCard = async (cardId: string, currentUserId: string, deps: { prisma: CardStore }): Promise<CardView> => {
  const card = await loadOwnedCard(cardId, currentUserId, deps.prisma);
  return toCardView(card);
};

export const availableCredit = async (
  cardId: string,
  currentUserId: string,
  deps: { prisma: CardStore },
): Promise<Decimal> => {
  const card = await loadOwnedCard(cardId, currentUserId, deps.prisma);
  return computeAvailableCredit(card);
};

export const previewPurchase = async (
  input: PreviewPurchaseInput,
  currentUserId: string,
  deps: { prisma: CardStore },
): Promise<{ schedule: ReturnType<typeof buildSchedule> }> => {
  const parsed = parseOrValidation(() => previewPurchaseInputSchema.parse(input));
  const card = await loadOwnedCard(parsed.cardId, currentUserId, deps.prisma);
  return { schedule: buildSchedule(card, parsed.totalAmount, parsed.purchaseDate, parsed.installments) };
};

export const createPurchase = async (
  input: PreviewPurchaseInput,
  currentUserId: string,
  deps: { prisma: CardStore },
): Promise<PurchaseView> => {
  const parsed = parseOrValidation(() => previewPurchaseInputSchema.parse(input));
  const card = await loadOwnedCard(parsed.cardId, currentUserId, deps.prisma);
  const amount = toMoney(parsed.totalAmount);
  if (amount.gt(computeAvailableCredit(card))) {
    throw createValidationError('The purchase exceeds the available credit.');
  }

  const schedule = buildSchedule(card, amount, parsed.purchaseDate, parsed.installments);
  const created = await deps.prisma.$transaction(async (tx) =>
    tx.creditCardPurchase.create({
      data: {
        userId: currentUserId,
        cardId: card.id,
        description: parsed.description,
        totalAmount: moneyString(amount),
        purchaseDate: fromCalendarDate(parsed.purchaseDate),
        installments: parsed.installments,
        status: 'OPEN',
        installmentsData: {
          create: schedule.map((row) => ({
            installmentNumber: row.installmentNumber,
            principalAmount: moneyString(row.principal),
            interestAmount: moneyString(row.interest),
            totalAmount: moneyString(row.total),
            dueDate: fromCalendarDate(row.dueDate),
            remainingBalance: moneyString(row.remainingBalance),
            status: 'OPEN',
          })),
        },
      },
    }),
  );

  return toPurchaseView(created);
};

export const payPurchaseInstallment = async (
  input: PayPurchaseInput,
  currentUserId: string,
  deps: { prisma: CardStore },
): Promise<PurchaseView> => {
  const parsed = parseOrValidation(() => payPurchaseInputSchema.parse(input));
  const purchase = await deps.prisma.creditCardPurchase.findUnique({ where: { id: parsed.purchaseId } });
  if (!purchase || purchase.card.userId !== currentUserId) {
    throw createNotFoundError('Purchase not found.');
  }

  const view = toPurchaseView(purchase);
  const current = view.installments.find((item) => item.outstanding.gt(0));
  if (!current) {
    throw createValidationError('There is no open installment to pay.');
  }
  if (parsed.installmentId && parsed.installmentId !== current.id) {
    throw createValidationError('Only the oldest open installment can be paid.');
  }

  const amount = toMoney(parsed.amount);
  if (amount.gt(current.outstanding)) {
    throw createValidationError('The payment exceeds the outstanding installment.');
  }

  const nextOutstanding = current.outstanding.minus(amount);
  const remaining = view.installments.reduce((sum, item) => sum.plus(item.outstanding), new Decimal(0)).minus(amount);
  const purchaseStatus = remaining.eq(0) ? 'PAID' : 'PARTIALLY_PAID';

  await deps.prisma.$transaction(async (tx) => {
    await tx.purchaseInstallmentPayment.create({
      data: { installmentId: current.id, amount: moneyString(amount), notes: parsed.notes },
    });
    await tx.purchaseInstallment.update({
      where: { id: current.id },
      data: { status: nextOutstanding.eq(0) ? 'PAID' : 'OPEN' },
    });
    await tx.creditCardPurchase.update({
      where: { id: purchase.id },
      data: { status: purchaseStatus },
    });
  });

  const updated = await deps.prisma.creditCardPurchase.findUnique({ where: { id: purchase.id } });
  if (!updated) {
    throw createNotFoundError('Purchase not found.');
  }
  return toPurchaseView(updated);
};

export const updateCard = async (
  cardId: string,
  input: { name?: string; bank?: string; creditLimit?: string; cutoffDay?: number; dueDay?: number },
  currentUserId: string,
  deps: { prisma: CardStore },
): Promise<CardView> => {
  const card = await loadOwnedCard(cardId, currentUserId, deps.prisma);
  const data: Record<string, unknown> = {};
  if (input.name !== undefined && input.name.trim()) {
    data.name = input.name.trim();
  }
  if (input.bank !== undefined && input.bank.trim()) {
    data.bank = input.bank.trim();
  }
  if (input.creditLimit !== undefined) {
    data.creditLimit = moneyString(input.creditLimit);
  }
  if (input.cutoffDay !== undefined) {
    data.cutoffDay = input.cutoffDay;
  }
  if (input.dueDay !== undefined) {
    data.dueDay = input.dueDay;
  }
  if (Object.keys(data).length === 0) {
    return toCardView(card);
  }
  const updated = await deps.prisma.creditCard.update({ where: { id: cardId }, data });
  return toCardView(updated);
};

export const deleteCard = async (
  cardId: string,
  currentUserId: string,
  deps: { prisma: CardStore },
): Promise<void> => {
  const card = await loadOwnedCard(cardId, currentUserId, deps.prisma);
  const view = toCardView(card);
  const hasOpenPurchases = view.purchases.some(
    (p) => p.status === 'OPEN' || p.status === 'PARTIALLY_PAID',
  );
  if (hasOpenPurchases) {
    throw createValidationError('No se puede eliminar una tarjeta con compras activas.');
  }
  await deps.prisma.creditCard.delete({ where: { id: cardId } });
};

export const updateCardRate = async (
  input: UpdateCardRateInput,
  currentUserId: string,
  deps: { prisma: CardStore },
): Promise<CardView> => {
  const parsed = parseOrValidation(() => updateCardRateInputSchema.parse(input));
  const card = await loadOwnedCard(parsed.cardId, currentUserId, deps.prisma);

  for (const purchase of card.purchases ?? []) {
    if (purchase.status === 'PAID' || purchase.status === 'CANCELLED') {
      continue;
    }
    const mapped: RecalcInstallmentInput[] = purchase.installmentsData.map((item) => {
      const view = toInstallmentView(item);
      return {
        installmentNumber: item.installmentNumber,
        dueDate: {
          year: item.dueDate.getUTCFullYear(),
          month: item.dueDate.getUTCMonth() + 1,
          day: item.dueDate.getUTCDate(),
        },
        status: view.status === 'PAID' ? 'PAID' : 'OPEN',
        remainingBalance: toMoney(item.remainingBalance),
        hasPayments: (item.payments ?? []).length > 0,
      };
    });
    const result = recalcOpenFrenchInstallments({
      purchaseTotal: purchase.totalAmount,
      annualRate: parsed.annualRate,
      installments: mapped,
    });
    if (result.kind === 'conflict') {
      throw createConflictError('Cannot change the rate while an installment has a partial payment.');
    }

    await deps.prisma.$transaction(async (tx) => {
      await tx.creditCard.update({
        where: { id: card.id },
        data: { annualRate: new Decimal(parsed.annualRate).toString() },
      });
      for (const row of result.schedule) {
        const existing = purchase.installmentsData.find((item) => item.installmentNumber === row.installmentNumber);
        if (!existing) {
          continue;
        }
        await tx.purchaseInstallment.update({
          where: { id: existing.id },
          data: {
            principalAmount: moneyString(row.principal),
            interestAmount: moneyString(row.interest),
            totalAmount: moneyString(row.total),
            remainingBalance: moneyString(row.remainingBalance),
          },
        });
      }
    });
  }

  if ((card.purchases ?? []).length === 0) {
    await deps.prisma.creditCard.update({
      where: { id: card.id },
      data: { annualRate: new Decimal(parsed.annualRate).toString() },
    });
  }

  const updated = await loadOwnedCard(parsed.cardId, currentUserId, deps.prisma);
  return toCardView(updated);
};
