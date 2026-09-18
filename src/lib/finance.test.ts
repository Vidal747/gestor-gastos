import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';

import {
  assertManualSchedule,
  buildMonthlyDebtSchedule,
  calculateInstallments,
  distributeAmount,
  firstInstallmentDueDate,
  installmentOutstanding,
  monthlyRateFromAnnualRate,
  netBalanceBetween,
  outstandingDebt,
  recalcOpenFrenchInstallments,
  toMoney,
} from './finance';

describe('finance utilities', () => {
  it('converts annual rate to monthly effective rate without dividing by 12', () => {
    const monthlyRate = monthlyRateFromAnnualRate(0.12);
    expect(monthlyRate.toNumber()).toBeCloseTo(0.00948879, 6);
  });

  it('distributes a total between participants deterministically and with exact sum', () => {
    const result = distributeAmount(new Decimal('1000'), [
      { userId: 'a', share: new Decimal('0.5') },
      { userId: 'b', share: new Decimal('0.5') },
    ]);

    expect(result.get('a')?.toNumber()).toBe(500);
    expect(result.get('b')?.toNumber()).toBe(500);
  });

  it('calculates fixed installments and keeps totals consistent', () => {
    const installments = calculateInstallments(1200, 6, 0.12);
    const sumPrincipal = installments.reduce((acc, item) => acc.plus(item.principal), new Decimal(0));
    const sumInterest = installments.reduce((acc, item) => acc.plus(item.interest), new Decimal(0));
    const sumTotal = installments.reduce((acc, item) => acc.plus(item.total), new Decimal(0));

    expect(sumPrincipal.toNumber()).toBeCloseTo(1200, 2);
    expect(sumTotal.toNumber()).toBeCloseTo(sumPrincipal.plus(sumInterest).toNumber(), 2);
    expect(installments[0].total.toNumber()).toBeGreaterThan(0);
  });

  it('tracks an outstanding debt after partial payments', () => {
    const balance = outstandingDebt(new Decimal('300'), [new Decimal('200')]);
    expect(balance.toNumber()).toBe(100);
  });

  it('computes a net balance while preserving original movements', () => {
    const net = netBalanceBetween(new Decimal('500'), new Decimal('200'));
    expect(net.toNumber()).toBe(300);
  });

  it('rounds money to the defined currency precision', () => {
    expect(toMoney('99.995').toNumber()).toBe(100);
  });

  it('charges more interest in early french installments than in later ones', () => {
    const schedule = calculateInstallments(1_200_000, 6, 0.24);
    expect(schedule[0].interest.gt(schedule[5].interest)).toBe(true);
    expect(schedule[5].principal.gt(schedule[0].principal)).toBe(true);
    const sumPrincipal = schedule.reduce((acc, row) => acc.plus(row.principal), new Decimal(0));
    expect(sumPrincipal.toFixed(2)).toBe('1200000.00');
  });

  it('splits principal evenly when IEA is zero', () => {
    const schedule = calculateInstallments(100, 4, 0);
    schedule.forEach((row) => {
      expect(row.interest.toNumber()).toBe(0);
      expect(row.principal.toNumber()).toBe(25);
    });
  });

  it('places first due date in the same month when purchase is before cutoff and dueDay > cutoffDay', () => {
    expect(firstInstallmentDueDate({ year: 2026, month: 1, day: 3 }, 5, 20)).toEqual({
      year: 2026,
      month: 1,
      day: 20,
    });
  });

  it('places first due date next cycle when purchase is after cutoff', () => {
    expect(firstInstallmentDueDate({ year: 2026, month: 1, day: 6 }, 5, 20)).toEqual({
      year: 2026,
      month: 2,
      day: 20,
    });
  });

  it('excludes the cutoff day itself from the current cycle', () => {
    expect(firstInstallmentDueDate({ year: 2026, month: 1, day: 5 }, 5, 20)).toEqual({
      year: 2026,
      month: 2,
      day: 20,
    });
  });

  it('uses the month after cutoff when dueDay is on or before cutoffDay', () => {
    expect(firstInstallmentDueDate({ year: 2026, month: 1, day: 10 }, 20, 5)).toEqual({
      year: 2026,
      month: 2,
      day: 5,
    });
  });

  it('rejects IEA recalc when an unpaid installment already has payments', () => {
    const result = recalcOpenFrenchInstallments({
      purchaseTotal: 1200,
      annualRate: 0.3,
      installments: [
        {
          installmentNumber: 1,
          dueDate: { year: 2026, month: 1, day: 20 },
          status: 'OPEN',
          remainingBalance: new Decimal(900),
          hasPayments: true,
        },
        {
          installmentNumber: 2,
          dueDate: { year: 2026, month: 2, day: 20 },
          status: 'OPEN',
          remainingBalance: new Decimal(600),
          hasPayments: false,
        },
      ],
    });
    expect(result.kind).toBe('conflict');
  });

  it('rebuilds only unpaid installments after IEA change', () => {
    const original = calculateInstallments(1200, 4, 0.12);
    const result = recalcOpenFrenchInstallments({
      purchaseTotal: 1200,
      annualRate: 0.24,
      installments: [
        {
          installmentNumber: 1,
          dueDate: { year: 2026, month: 1, day: 20 },
          status: 'PAID',
          remainingBalance: original[0].remainingBalance,
          hasPayments: true,
        },
        {
          installmentNumber: 2,
          dueDate: { year: 2026, month: 2, day: 20 },
          status: 'OPEN',
          remainingBalance: original[1].remainingBalance,
          hasPayments: false,
        },
        {
          installmentNumber: 3,
          dueDate: { year: 2026, month: 3, day: 20 },
          status: 'OPEN',
          remainingBalance: original[2].remainingBalance,
          hasPayments: false,
        },
        {
          installmentNumber: 4,
          dueDate: { year: 2026, month: 4, day: 20 },
          status: 'OPEN',
          remainingBalance: original[3].remainingBalance,
          hasPayments: false,
        },
      ],
    });
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') {
      return;
    }
    expect(result.schedule).toHaveLength(3);
    const sumPrincipal = result.schedule.reduce((acc, row) => acc.plus(row.principal), new Decimal(0));
    expect(sumPrincipal.toFixed(2)).toBe(original[0].remainingBalance.toFixed(2));
    expect(result.schedule[0].installmentNumber).toBe(2);
    expect(result.schedule[0].dueDate).toEqual({ year: 2026, month: 2, day: 20 });
  });

  it('computes installment outstanding from payments, never from remainingBalance', () => {
    expect(installmentOutstanding('100.00', ['40.00']).toFixed(2)).toBe('60.00');
  });

  it('rejects a manual schedule whose amounts do not sum to the total', () => {
    expect(() =>
      assertManualSchedule(100, [
        { amount: 40, dueDate: { year: 2026, month: 1, day: 10 } },
        { amount: 50, dueDate: { year: 2026, month: 2, day: 10 } },
      ]),
    ).toThrow();
  });

  it('accepts a manual schedule that sums exactly to the total', () => {
    expect(() =>
      assertManualSchedule(100, [
        { amount: 40, dueDate: { year: 2026, month: 1, day: 10 } },
        { amount: 60, dueDate: { year: 2026, month: 2, day: 10 } },
      ]),
    ).not.toThrow();
  });

  it('builds equal monthly debt installments from amount, due day and duration', () => {
    const schedule = buildMonthlyDebtSchedule({
      amount: '200000',
      dueDay: 30,
      count: 3,
      from: { year: 2026, month: 9, day: 16 },
    });
    expect(schedule).toEqual([
      { amount: toMoney('200000'), dueDate: { year: 2026, month: 9, day: 30 } },
      { amount: toMoney('200000'), dueDate: { year: 2026, month: 10, day: 30 } },
      { amount: toMoney('200000'), dueDate: { year: 2026, month: 11, day: 30 } },
    ]);
  });

  it('clamps due day 30 to the last day of February', () => {
    const schedule = buildMonthlyDebtSchedule({
      amount: 100,
      dueDay: 30,
      count: 2,
      from: { year: 2026, month: 2, day: 1 },
    });
    expect(schedule[0].dueDate).toEqual({ year: 2026, month: 2, day: 28 });
    expect(schedule[1].dueDate).toEqual({ year: 2026, month: 3, day: 30 });
  });

  it('starts next month when the due day already passed', () => {
    const schedule = buildMonthlyDebtSchedule({
      amount: 50,
      dueDay: 5,
      count: 1,
      from: { year: 2026, month: 9, day: 16 },
    });
    expect(schedule[0].dueDate).toEqual({ year: 2026, month: 10, day: 5 });
  });
});
