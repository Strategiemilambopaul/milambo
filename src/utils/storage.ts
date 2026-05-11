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

export function createDefaultBudgetState(): BudgetState {
  return {
    initialBudget: DEFAULT_INITIAL_BUDGET,
    expenses: [],
    history: [],
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
