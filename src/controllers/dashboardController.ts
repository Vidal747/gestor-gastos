import Decimal from 'decimal.js';

import { listAccounts, type AccountStore } from '@/controllers/accountController';
import { listCards, type CardStore } from '@/controllers/cardController';
import { listDebts, type DebtStore } from '@/controllers/debtController';
import { listIncomes, type IncomeStore } from '@/controllers/incomeController';
import { listRelationships, type RelationshipStore } from '@/controllers/relationshipController';
import { listSavingGoals, type SavingStore } from '@/controllers/savingController';
import { listUpcoming, type UpcomingItem } from '@/controllers/upcomingController';
import { toMoney } from '@/lib/finance';

export type CardBreakdown = { id: string; name: string; used: number; available: number };
export type SavingBreakdown = { id: string; name: string; saved: number; remaining: number };
export type CategoryBreakdown = { category: string; label: string; amount: number };
export type DayBreakdown = { day: string; fullDay: string; amount: number };

const INCOME_CATEGORY_LABELS: Record<string, string> = {
  SALARY: 'Salario',
  FREELANCE: 'Freelance',
  REFUND: 'Reembolso',
  SALE: 'Venta',
  EXTRA: 'Extra',
  OTHER: 'Otro',
};

export type DashboardView = {
  netPosition: Decimal;
  iOweTotal: Decimal;
  theyOweTotal: Decimal;
  cardDebtTotal: Decimal;
  cardCreditTotal: Decimal;
  cardAvailableTotal: Decimal;
  savingsTarget: Decimal;
  savingsCurrent: Decimal;
  savingsProgress: number;
  savingsCount: number;
  relationshipsCount: number;
  activeDebtCount: number;
  accountCount: number;
  currentMonthIncome: Decimal;
  upcoming: UpcomingItem[];
  overdue: UpcomingItem[];
  cardBreakdown: CardBreakdown[];
  savingsBreakdown: SavingBreakdown[];
  incomeByCategory: CategoryBreakdown[];
  upcomingByDay: DayBreakdown[];
};

export type DashboardDeps = {
  debts: DebtStore;
  cards: CardStore;
  savings: SavingStore;
  relationships: RelationshipStore;
  accounts?: AccountStore;
  incomes?: IncomeStore;
};

export const getDashboard = async (
  currentUserId: string,
  deps: DashboardDeps,
): Promise<DashboardView> => {
  const [debts, cards, savings, relationships, upcoming, accounts = [], incomes = []] = await Promise.all([
    listDebts(currentUserId, { prisma: deps.debts }),
    listCards(currentUserId, { prisma: deps.cards }),
    listSavingGoals(currentUserId, { prisma: deps.savings }),
    listRelationships(currentUserId, { prisma: deps.relationships }),
    listUpcoming(currentUserId, { debts: deps.debts, cards: deps.cards }),
    deps.accounts ? listAccounts(currentUserId, { prisma: deps.accounts }) : Promise.resolve([]),
    deps.incomes ? listIncomes(currentUserId, { prisma: deps.incomes }) : Promise.resolve([]),
  ]);

  const iOweTotal = relationships
    .filter((r) => r.direction === 'i_owe')
    .reduce((sum, r) => sum.plus(r.net), new Decimal(0));

  const theyOweTotal = relationships
    .filter((r) => r.direction === 'they_owe')
    .reduce((sum, r) => sum.plus(r.net), new Decimal(0));

  const netPosition = theyOweTotal.minus(iOweTotal);

  const cardDebtTotal = cards.reduce(
    (sum, card) =>
      sum.plus(
        card.purchases.reduce(
          (s, p) => s.plus(p.installments.reduce((t, i) => t.plus(i.outstanding), new Decimal(0))),
          new Decimal(0),
        ),
      ),
    new Decimal(0),
  );

  const cardCreditTotal = cards.reduce((sum, card) => sum.plus(card.creditLimit), new Decimal(0));
  const cardAvailableTotal = cards.reduce((sum, card) => sum.plus(card.availableCredit), new Decimal(0));

  const savingsTarget = savings.reduce((sum, s) => sum.plus(s.targetAmount), new Decimal(0));
  const savingsCurrent = savings.reduce((sum, s) => sum.plus(s.savedAmount), new Decimal(0));
  const savingsProgress = savingsTarget.eq(0) ? 0 : savingsCurrent.div(savingsTarget).times(100).toNumber();

  const accountCount = accounts.length;

  const now = new Date();
  const currentMonthIncome = incomes
    .filter((i) => i.date.getUTCFullYear() === now.getUTCFullYear() && i.date.getUTCMonth() === now.getUTCMonth())
    .reduce((sum, i) => sum.plus(i.amount), new Decimal(0));

  const activeDebtCount = debts.filter((d) => d.status !== 'PAID').length;

  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const cardBreakdown: CardBreakdown[] = cards.map((card) => {
    const used = toMoney(card.creditLimit).minus(toMoney(card.availableCredit));
    return {
      id: card.id,
      name: card.name,
      used: Math.max(0, used.toNumber()),
      available: Math.max(0, toMoney(card.availableCredit).toNumber()),
    };
  });

  const savingsBreakdown: SavingBreakdown[] = savings.map((saving) => ({
    id: saving.id,
    name: saving.name,
    saved: toMoney(saving.savedAmount).toNumber(),
    remaining: Math.max(0, toMoney(saving.remainingAmount).toNumber()),
  }));

  const incomeByMonth = incomes.filter(
    (i) => i.date.getUTCFullYear() === now.getUTCFullYear() && i.date.getUTCMonth() === now.getUTCMonth(),
  );
  const incomeByCategoryMap = new Map<string, Decimal>();
  for (const income of incomeByMonth) {
    incomeByCategoryMap.set(
      income.category,
      (incomeByCategoryMap.get(income.category) ?? new Decimal(0)).plus(income.amount),
    );
  }
  const incomeByCategory: CategoryBreakdown[] = [...incomeByCategoryMap.entries()].map(
    ([category, amount]) => ({
      category,
      label: INCOME_CATEGORY_LABELS[category] ?? category,
      amount: toMoney(amount).toNumber(),
    }),
  );

  const dayFormatter = new Intl.DateTimeFormat('es-CO', { weekday: 'short', timeZone: 'America/Bogota' });
  const upcomingByDayMap = new Map<string, { fullDay: string; amount: Decimal }>();
  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
    const key = `${day.getUTCDate()}/${day.getUTCMonth() + 1}`;
    upcomingByDayMap.set(key, { fullDay: dayFormatter.format(day), amount: new Decimal(0) });
  }
  for (const item of upcoming) {
    if (item.dueDate < now || item.dueDate > nextWeek) continue;
    const key = `${item.dueDate.getUTCDate()}/${item.dueDate.getUTCMonth() + 1}`;
    const existing = upcomingByDayMap.get(key) ?? { fullDay: dayFormatter.format(item.dueDate), amount: new Decimal(0) };
    upcomingByDayMap.set(key, { fullDay: existing.fullDay, amount: existing.amount.plus(item.outstanding) });
  }
  const upcomingByDay: DayBreakdown[] = [...upcomingByDayMap.entries()].map(([day, value]) => ({
    day,
    fullDay: value.fullDay,
    amount: value.amount.toNumber(),
  }));

  const overdue = upcoming
    .filter((item) => item.dueDate < now)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const upcomingFiltered = upcoming
    .filter((item) => item.dueDate >= now && item.dueDate <= nextWeek)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  return {
    netPosition: toMoney(netPosition),
    iOweTotal: toMoney(iOweTotal),
    theyOweTotal: toMoney(theyOweTotal),
    cardDebtTotal: toMoney(cardDebtTotal),
    cardCreditTotal: toMoney(cardCreditTotal),
    cardAvailableTotal: toMoney(cardAvailableTotal),
    savingsTarget: toMoney(savingsTarget),
    savingsCurrent: toMoney(savingsCurrent),
    savingsProgress: Math.min(100, Math.max(0, savingsProgress)),
    savingsCount: savings.length,
    relationshipsCount: relationships.length,
    activeDebtCount,
    accountCount,
    currentMonthIncome: toMoney(currentMonthIncome),
    upcoming: upcomingFiltered.slice(0, 6),
    overdue: overdue.slice(0, 6),
    cardBreakdown,
    savingsBreakdown,
    incomeByCategory,
    upcomingByDay,
  };
};
