import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';

import {
  calculateInstallments,
  distributeAmount,
  monthlyRateFromAnnualRate,
  netBalanceBetween,
  outstandingDebt,
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
});
