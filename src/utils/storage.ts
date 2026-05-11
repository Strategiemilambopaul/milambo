import { DEFAULT_CATEGORIES, type BudgetHistoryEntry, type BudgetState, type Category, type Expense } from '../types/budget'
import { computeExpenseTotal, roundCurrency } from './calculations'

const STORAGE_KEY = 'milambo_budget_state_v1'
const MAX_HISTORY_ITEMS = 100
const DEFAULT_INITIAL_BUDGET = 21_500_000
const CATEGORY_ALIASES: Record<string, Category> = {
  Pel: 'Pelle',
  Caillaces: 'Caillasse',
  'Transport materiels': 'Transport materiaux',
  'Mange macon': 'Repas macon',
}
const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'seed-achat-poisson',
    title: 'Achat poisson',
    description: 'Achat des poissons a maluku par kayembe, pour la vente a lukala',
    category: 'Planche',
    unitPrice: 2_100_000,
    quantity: 1,
    totalCost: 2_100_000,
    createdAt: '2026-05-11T21:51:00+01:00',
    updatedAt: '2026-05-11T21:51:00+01:00',
  },
  {
    id: 'seed-cailloux',
    title: 'Cailloux',
    description: 'Achat cailloux au depot badiadingi',
    category: 'Caillasse',
    unitPrice: 49_350,
    quantity: 10,
    totalCost: 493_500,
    createdAt: '2026-05-11T21:50:00+01:00',
    updatedAt: '2026-05-11T21:50:00+01:00',
  },
  {
    id: 'seed-sable',
    title: 'SABLE',
    description: 'Achat sable, pour la construction.',
    category: 'Sable',
    unitPrice: 27_500,
    quantity: 10,
    totalCost: 275_000,
    createdAt: '2026-05-11T21:49:00+01:00',
    updatedAt: '2026-05-11T21:49:00+01:00',
  },
  {
    id: 'seed-transport-cailloux',
    title: 'Transport cailloux',
    description: 'Le transport qui a permis de transport le cailloux a la maison',
    category: 'Transport materiaux',
    unitPrice: 180_000,
    quantity: 1,
    totalCost: 180_000,
    createdAt: '2026-05-11T21:49:00+01:00',
    updatedAt: '2026-05-11T21:49:00+01:00',
  },
  {
    id: 'seed-deplacement',
    title: 'Deplacement',
    description: "Deplacement par moto, qui nous permit de nous deplacer avec l'ingenieur",
    category: 'Transport macon',
    unitPrice: 20_000,
    quantity: 1,
    totalCost: 20_000,
    createdAt: '2026-05-11T21:48:00+01:00',
    updatedAt: '2026-05-11T21:48:00+01:00',
  },
  {
    id: 'seed-bloc-brique',
    title: 'Bloc (brique)',
    description: 'Achat des bloc rouges, par reservation',
    category: 'Brique',
    unitPrice: 2_350,
    quantity: 500,
    totalCost: 1_175_000,
    createdAt: '2026-05-11T21:45:00+01:00',
    updatedAt: '2026-05-11T21:45:00+01:00',
  },
  {
    id: 'seed-bar-6',
    title: 'BAR de 6',
    description: 'Achat de bar de ferre de 6 avec reduction de 3%',
    category: 'Barre de fer 6',
    unitPrice: 8_500,
    quantity: 30,
    totalCost: 255_000,
    createdAt: '2026-05-11T21:45:00+01:00',
    updatedAt: '2026-05-11T21:45:00+01:00',
  },
  {
    id: 'seed-achat-bar-12',
    title: 'Achat bar de 12',
    description: 'Achat bar de fer de 12, avec une reduction de 3%',
    category: 'Barre de fer 12',
    unitPrice: 32_437.5,
    quantity: 40,
    totalCost: 1_297_500,
    createdAt: '2026-05-11T21:44:00+01:00',
    updatedAt: '2026-05-11T21:44:00+01:00',
  },
]

export function createDefaultBudgetState(): BudgetState {
  return {
    initialBudget: DEFAULT_INITIAL_BUDGET,
    expenses: DEFAULT_EXPENSES,
    history: [
      {
        id: 'seed-default-expenses',
        type: 'expense-add',
        message: 'Enregistrements par defaut charges.',
        createdAt: '2026-05-11T21:52:00+01:00',
      },
    ],
  }
}

const initialState: BudgetState = createDefaultBudgetState()

function isCategory(value: string): value is Category {
  return DEFAULT_CATEGORIES.includes(value as Category)
}

function normalizeCategory(rawCategory: string): Category {
  const aliased = CATEGORY_ALIASES[rawCategory] ?? rawCategory
  if (isCategory(aliased)) {
    return aliased
  }
  return DEFAULT_CATEGORIES[0]
}

function normalizeExpense(rawExpense: Partial<Expense>): Expense | null {
  if (!rawExpense.id || !rawExpense.title) {
    return null
  }

  const unitPrice = Number(rawExpense.unitPrice ?? 0)
  const quantity = Number(rawExpense.quantity ?? 1)
  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1
  const safeUnitPrice = Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : 0
  const totalCost = computeExpenseTotal(safeUnitPrice, safeQuantity)
  const nowIso = new Date().toISOString()

  return {
    id: rawExpense.id,
    title: String(rawExpense.title).trim(),
    description: String(rawExpense.description ?? ''),
    unitPrice: roundCurrency(safeUnitPrice),
    quantity: safeQuantity,
    totalCost,
    category: normalizeCategory(String(rawExpense.category ?? DEFAULT_CATEGORIES[0])),
    createdAt: rawExpense.createdAt ?? nowIso,
    updatedAt: rawExpense.updatedAt ?? rawExpense.createdAt ?? nowIso,
  }
}

function normalizeHistoryItem(rawHistory: Partial<BudgetHistoryEntry>): BudgetHistoryEntry | null {
  if (!rawHistory.id || !rawHistory.type || !rawHistory.message) {
    return null
  }

  return {
    id: rawHistory.id,
    type: rawHistory.type,
    message: rawHistory.message,
    createdAt: rawHistory.createdAt ?? new Date().toISOString(),
  }
}

export function normalizeBudgetState(rawState: Partial<BudgetState>): BudgetState {
  const budgetRaw = Number(rawState.initialBudget ?? DEFAULT_INITIAL_BUDGET)
  const initialBudget =
    Number.isFinite(budgetRaw) && budgetRaw >= 0 ? roundCurrency(budgetRaw) : DEFAULT_INITIAL_BUDGET

  const expenses = (rawState.expenses ?? [])
    .map((expense) => normalizeExpense(expense))
    .filter((expense): expense is Expense => Boolean(expense))

  const history = (rawState.history ?? [])
    .map((item) => normalizeHistoryItem(item))
    .filter((item): item is BudgetHistoryEntry => Boolean(item))
    .slice(0, MAX_HISTORY_ITEMS)

  return {
    initialBudget,
    expenses,
    history,
  }
}

export function loadBudgetState(): BudgetState {
  if (typeof window === 'undefined') {
    return initialState
  }

  try {
    const rawData = window.localStorage.getItem(STORAGE_KEY)
    if (!rawData) {
      return initialState
    }

    const parsed = JSON.parse(rawData) as Partial<BudgetState>
    return normalizeBudgetState(parsed)
  } catch {
    return initialState
  }
}

export function saveBudgetState(state: BudgetState): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearBudgetState(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}
