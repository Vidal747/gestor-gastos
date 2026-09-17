import Decimal from 'decimal.js';

import { toMoney } from '@/lib/finance';

export type RelationshipDebt = {
  ownerUserId: string;
  ownerRole: 'DEBTOR' | 'CREDITOR';
  counterpartyUserId: string | null;
  remainingAmount: Decimal | number | string;
};

export const canonicalUserPair = (leftUserId: string, rightUserId: string): { lowUserId: string; highUserId: string } =>
  leftUserId < rightUserId
    ? { lowUserId: leftUserId, highUserId: rightUserId }
    : { lowUserId: rightUserId, highUserId: leftUserId };

const involves = (debt: RelationshipDebt, currentUserId: string, peerUserId: string): boolean => {
  const owner = debt.ownerUserId;
  const other = debt.counterpartyUserId;
  return (
    (owner === currentUserId && other === peerUserId) || (owner === peerUserId && other === currentUserId)
  );
};

export const relationshipNet = (input: {
  currentUserId: string;
  peerUserId: string;
  debts: RelationshipDebt[];
}): Decimal => {
  return input.debts.reduce((net, debt) => {
    if (!involves(debt, input.currentUserId, input.peerUserId)) {
      return net;
    }
    const remaining = toMoney(debt.remainingAmount);
    const currentOwnsTheDebt = debt.ownerUserId === input.currentUserId;
    const iOwe = currentOwnsTheDebt ? debt.ownerRole === 'DEBTOR' : debt.ownerRole === 'CREDITOR';
    return iOwe ? net.minus(remaining) : net.plus(remaining);
  }, new Decimal(0));
};
