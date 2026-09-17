import Decimal from 'decimal.js';

import { listCards, type CardStore } from '@/controllers/cardController';
import { listDebts, type DebtStore } from '@/controllers/debtController';

export type UpcomingItem = {
  kind: 'debt' | 'card';
  id: string;
  title: string;
  dueDate: Date;
  outstanding: Decimal;
  href: string;
};

export const listUpcoming = async (
  currentUserId: string,
  deps: { debts: DebtStore; cards: CardStore },
): Promise<UpcomingItem[]> => {
  const [debts, cards] = await Promise.all([
    listDebts(currentUserId, { prisma: deps.debts }),
    listCards(currentUserId, { prisma: deps.cards }),
  ]);

  const items: UpcomingItem[] = [];

  for (const debt of debts) {
    for (const installment of debt.installments) {
      if (installment.outstanding.gt(0)) {
        items.push({
          kind: 'debt',
          id: installment.id,
          title: debt.description,
          dueDate: installment.dueDate,
          outstanding: installment.outstanding,
          href: `/deudas/${debt.id}`,
        });
      }
    }
  }

  for (const card of cards) {
    for (const purchase of card.purchases) {
      for (const installment of purchase.installments) {
        if (installment.outstanding.gt(0)) {
          items.push({
            kind: 'card',
            id: installment.id,
            title: `${card.name} · ${purchase.description}`,
            dueDate: installment.dueDate,
            outstanding: installment.outstanding,
            href: `/tarjetas/${card.id}/compras/${purchase.id}`,
          });
        }
      }
    }
  }

  return items.sort((left, right) => left.dueDate.getTime() - right.dueDate.getTime());
};
