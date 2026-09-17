import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { canonicalUserPair, relationshipNet } from './relationshipNet';

describe('relationshipNet', () => {
  it('orders a pair so the same two users always match', () => {
    expect(canonicalUserPair('b', 'a')).toEqual({ lowUserId: 'a', highUserId: 'b' });
    expect(canonicalUserPair('a', 'b')).toEqual({ lowUserId: 'a', highUserId: 'b' });
  });

  it('summarizes I owe vs they owe me without destroying either debt', () => {
    const net = relationshipNet({
      currentUserId: 'ana',
      peerUserId: 'bruno',
      debts: [
        { ownerUserId: 'ana', ownerRole: 'DEBTOR', counterpartyUserId: 'bruno', remainingAmount: 300 },
        { ownerUserId: 'bruno', ownerRole: 'DEBTOR', counterpartyUserId: 'ana', remainingAmount: 100 },
      ],
    });
    expect(net.toNumber()).toBe(-200);
  });

  it('treats a credit I registered as money they owe me', () => {
    const net = relationshipNet({
      currentUserId: 'ana',
      peerUserId: 'bruno',
      debts: [{ ownerUserId: 'ana', ownerRole: 'CREDITOR', counterpartyUserId: 'bruno', remainingAmount: 80 }],
    });
    expect(net.toNumber()).toBe(80);
    expect(net).toBeInstanceOf(Decimal);
  });
});
