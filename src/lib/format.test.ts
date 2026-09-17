import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { debtStance, relationshipCopy } from './format';

describe('debtStance', () => {
  const debt = {
    ownerUserId: 'ana',
    ownerRole: 'DEBTOR' as const,
    ownerName: 'Ana',
    counterpartyLabel: 'Bruno',
  };

  it('speaks from the owner when they owe', () => {
    expect(debtStance(debt, 'ana')).toEqual({
      iOwe: true,
      otherName: 'Bruno',
      headline: 'Le debes a Bruno',
    });
  });

  it('flips the sentence for the other person', () => {
    expect(debtStance(debt, 'bruno')).toEqual({
      iOwe: false,
      otherName: 'Ana',
      headline: 'Te debe Ana',
    });
  });
});

describe('relationshipCopy', () => {
  it('names the net in plain language', () => {
    expect(relationshipCopy('even', new Decimal(0))).toBe('Están a paz');
    expect(relationshipCopy('i_owe', new Decimal(12000))).toContain('Le debes');
    expect(relationshipCopy('they_owe', new Decimal(12000))).toContain('Te debe');
  });
});
