import Decimal from 'decimal.js';

export const MONEY_PRECISION = 2;
export const MONEY_MULTIPLIER = new Decimal(10).pow(MONEY_PRECISION);

export type Money = Decimal;

const asDecimal = (value: number | string | Decimal): Decimal => {
  return typeof value === 'string' || typeof value === 'number' ? new Decimal(value) : value;
};

export const toMoney = (value: number | string | Decimal): Decimal => {
  return asDecimal(value).toDecimalPlaces(MONEY_PRECISION, Decimal.ROUND_HALF_UP);
};

export const moneyToNumber = (value: Decimal): number => Number(value.toFixed(MONEY_PRECISION));

export const monthlyRateFromAnnualRate = (annualRate: Decimal | number | string): Decimal => {
  const rate = asDecimal(annualRate);
  if (rate.lte(0)) {
    return new Decimal(0);
  }

  return new Decimal(1).plus(rate).pow(new Decimal(1).div(12)).minus(1);
};

export const distributeAmount = (
  total: Decimal | number | string,
  participants: Array<{ userId: string; share: Decimal | number | string }>,
): Map<string, Decimal> => {
  const totalAmount = toMoney(total);
  const entries = participants.map((participant) => ({
    userId: participant.userId,
    share: new Decimal(participant.share),
  }));

  const totalShare = entries.reduce((sum, participant) => sum.plus(participant.share), new Decimal(0));

  if (totalShare.lte(0)) {
    throw new Error('The total share must be greater than zero.');
  }

  const raw = entries.map(({ userId, share }) => ({
    userId,
    amount: totalAmount.mul(share.div(totalShare)),
  }));

  const roundedTotal = raw.reduce((sum, item) => sum.plus(item.amount), new Decimal(0)).toDecimalPlaces(MONEY_PRECISION, Decimal.ROUND_HALF_UP);
  const diff = totalAmount.minus(roundedTotal).toDecimalPlaces(MONEY_PRECISION, Decimal.ROUND_HALF_UP);

  const result = new Map<string, Decimal>();

  raw.forEach((item, index) => {
    const value = index === raw.length - 1 ? toMoney(item.amount.plus(diff)) : toMoney(item.amount);
    result.set(item.userId, value);
  });

  return result;
};

export const calculateInstallments = (
  totalAmount: Decimal | number | string,
  installments: number,
  annualRate: Decimal | number | string,
): Array<{ installmentNumber: number; principal: Decimal; interest: Decimal; total: Decimal; remainingBalance: Decimal }> => {
  const principal = toMoney(totalAmount);
  const count = Math.max(1, Math.trunc(installments));
  const monthlyRate = monthlyRateFromAnnualRate(annualRate);

  const installmentValue = monthlyRate.eq(0)
    ? principal.div(count)
    : principal.mul(monthlyRate).div(new Decimal(1).minus(new Decimal(1).plus(monthlyRate).pow(-count)));

  const result: Array<{ installmentNumber: number; principal: Decimal; interest: Decimal; total: Decimal; remainingBalance: Decimal }> = [];
  let remaining = principal;

  for (let index = 1; index <= count; index += 1) {
    const interest = toMoney(remaining.mul(monthlyRate));
    const principalPayment = index === count ? toMoney(remaining) : toMoney(installmentValue.minus(interest));
    const totalAmountForInstallment = toMoney(principalPayment.plus(interest));
    remaining = remaining.minus(principalPayment);

    result.push({
      installmentNumber: index,
      principal: principalPayment,
      interest,
      total: totalAmountForInstallment,
      remainingBalance: toMoney(remaining),
    });
  }

  return result;
};

export const normalizeMoney = (value: Decimal | number | string): Decimal => toMoney(value);

export const percentageShare = (value: Decimal | number | string, total: Decimal | number | string): Decimal => {
  const numerator = toMoney(value);
  const denominator = toMoney(total);

  if (denominator.eq(0)) {
    return new Decimal(0);
  }

  return numerator.div(denominator).mul(100);
};

export const outstandingDebt = (principal: Decimal | number | string, payments: Array<Decimal | number | string>): Decimal => {
  const base = toMoney(principal);
  return payments.reduce<Decimal>((remaining, payment) => remaining.minus(toMoney(payment)), base);
};

export const netBalanceBetween = (amountPaidByA: Decimal | number | string, amountPaidByB: Decimal | number | string): Decimal => {
  return toMoney(toMoney(amountPaidByA).minus(toMoney(amountPaidByB)));
};

export type CalendarDate = { year: number; month: number; day: number };

export type RecalcInstallmentInput = {
  installmentNumber: number;
  dueDate: CalendarDate;
  status: 'PAID' | 'OPEN' | 'OVERDUE' | 'CANCELLED';
  remainingBalance: Decimal;
  hasPayments: boolean;
};

export type RecalculatedInstallment = ReturnType<typeof calculateInstallments>[number] & {
  dueDate: CalendarDate;
};

export type RecalcResult =
  | { kind: 'ok'; schedule: RecalculatedInstallment[] }
  | { kind: 'conflict' };

export const fromCalendarDate = (date: CalendarDate): Date =>
  new Date(Date.UTC(date.year, date.month - 1, date.day, 17, 0, 0));

export const toCalendarDate = (date: Date): CalendarDate => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  return { year, month, day };
};

const addMonths = (date: CalendarDate, months: number): CalendarDate => {
  const index = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return { year, month, day: date.day };
};

export const addMonthsClamped = addMonths;

export const firstInstallmentDueDate = (
  purchaseDate: CalendarDate,
  cutoffDay: number,
  dueDay: number,
): CalendarDate => {
  let closing: CalendarDate = { year: purchaseDate.year, month: purchaseDate.month, day: cutoffDay };
  if (purchaseDate.day >= cutoffDay) {
    closing = addMonths(closing, 1);
  }
  if (dueDay > cutoffDay) {
    return { year: closing.year, month: closing.month, day: dueDay };
  }
  return { ...addMonths(closing, 1), day: dueDay };
};

export const installmentDueDates = (firstDue: CalendarDate, count: number): CalendarDate[] =>
  Array.from({ length: count }, (_, index) => addMonths(firstDue, index));

export const installmentOutstanding = (
  installmentAmount: Decimal | number | string,
  payments: Array<Decimal | number | string>,
): Decimal => outstandingDebt(installmentAmount, payments);

export const remainingPrincipalAfterPaid = (
  purchaseTotal: Decimal | number | string,
  installments: RecalcInstallmentInput[],
): Decimal => {
  const paid = [...installments]
    .filter((row) => row.status === 'PAID')
    .sort((left, right) => left.installmentNumber - right.installmentNumber);
  if (paid.length === 0) {
    return toMoney(purchaseTotal);
  }
  return toMoney(paid[paid.length - 1].remainingBalance);
};

export const recalcOpenFrenchInstallments = (input: {
  purchaseTotal: Decimal | number | string;
  annualRate: Decimal | number | string;
  installments: RecalcInstallmentInput[];
}): RecalcResult => {
  const partialOpen = input.installments.some((row) => row.hasPayments && row.status !== 'PAID');
  if (partialOpen) {
    return { kind: 'conflict' };
  }

  const unpaid = [...input.installments]
    .filter((row) => row.status !== 'PAID' && row.status !== 'CANCELLED')
    .sort((left, right) => left.installmentNumber - right.installmentNumber);

  if (unpaid.length === 0) {
    return { kind: 'ok', schedule: [] };
  }

  const principal = remainingPrincipalAfterPaid(input.purchaseTotal, input.installments);
  const rebuilt = calculateInstallments(principal, unpaid.length, input.annualRate);

  return {
    kind: 'ok',
    schedule: rebuilt.map((row, index) => ({
      ...row,
      installmentNumber: unpaid[index].installmentNumber,
      dueDate: unpaid[index].dueDate,
    })),
  };
};

export const assertManualSchedule = (
  total: Decimal | number | string,
  rows: Array<{ amount: Decimal | number | string; dueDate: CalendarDate }>,
): void => {
  if (rows.length < 1) {
    throw new Error('At least one installment is required.');
  }

  const sum = rows.reduce((acc, row) => acc.plus(toMoney(row.amount)), new Decimal(0));
  if (!sum.eq(toMoney(total))) {
    throw new Error('Installment amounts must sum to the total.');
  }
};
