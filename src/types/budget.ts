export const DEFAULT_CATEGORIES = [
  'Planche',
  'Chevron',
  'Clous',
  'Pelle',
  'Brouette',
  'Machette',
  'Sable',
  'Ciment',
  'Caillasse',
  'Barre de fer 6',
  'Barre de fer 12',
  'Brique',
  'Transport macon',
  'Transport materiaux',
  'Repas macon',
  'Autre',
] as const

export type Category = (typeof DEFAULT_CATEGORIES)[number]

export type SortOption = 'date-desc' | 'date-asc' | 'cost-desc' | 'cost-asc' | 'title-asc'

export interface Expense {
  id: string
  title: string
  description: string
  unitPrice: number
  quantity: number
  totalCost: number
  category: Category
  createdAt: string
  updatedAt: string
}

export interface BudgetHistoryEntry {
  id: string
  type: 'budget-update' | 'expense-add' | 'expense-update' | 'expense-delete'
  message: string
  createdAt: string
}

export interface BudgetState {
  initialBudget: number
  expenses: Expense[]
  history: BudgetHistoryEntry[]
}

export interface BudgetSummary {
  totalExpenses: number
  remainingBudget: number
  spentPercentage: number
  isExceeded: boolean
}

export interface ExpenseFormValues {
  title: string
  description: string
  unitPrice: number
  quantity: number
  category: Category
}

export interface ExpenseFilters {
  search: string
  category: 'all' | Category
  sort: SortOption
}
