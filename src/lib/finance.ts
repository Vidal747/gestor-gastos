import Decimal from 'decimal.js';

export const MONEY_PRECISION = 2;
export const MONEY_MULTIPLIER = new Decimal(10).pow(MONEY_PRECISION);

export type Money = Decimal;

const asDecimal = (value: number | string | Decimal): Decimal => {
  return typeof value === 'string' || typeof value === 'number' ? new Decimal(value) : value;
};

export const toMoney = (value: number | string | Decimal): Decimal => {
  return asDecimal(value).round(MONEY_PRECISION, Decimal.ROUND_HALF_UP);
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

  const roundedTotal = raw.reduce((sum, item) => sum.plus(item.amount), new Decimal(0)).round(MONEY_PRECISION, Decimal.ROUND_HALF_UP);
  const diff = totalAmount.minus(roundedTotal).round(MONEY_PRECISION, Decimal.ROUND_HALF_UP);

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
  return payments.reduce((remaining, payment) => remaining.minus(toMoney(payment)), base);
};

export const netBalanceBetween = (amountPaidByA: Decimal | number | string, amountPaidByB: Decimal | number | string): Decimal => {
  return toMoney(toMoney(amountPaidByA).minus(toMoney(amountPaidByB)));
};
