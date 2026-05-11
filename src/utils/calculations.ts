import type { BudgetSummary, Category, Expense, ExpenseFilters } from '../types/budget'

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function computeExpenseTotal(unitPrice: number, quantity: number): number {
  return roundCurrency(unitPrice * quantity)
}

export function computeBudgetSummary(initialBudget: number, expenses: Expense[]): BudgetSummary {
  const totalExpenses = roundCurrency(
    expenses.reduce((acc, current) => acc + current.totalCost, 0),
  )
  const remainingBudget = roundCurrency(initialBudget - totalExpenses)
  const spentPercentage = initialBudget <= 0 ? 0 : Math.min((totalExpenses / initialBudget) * 100, 999)

  return {
    totalExpenses,
    remainingBudget,
    spentPercentage: roundCurrency(spentPercentage),
    isExceeded: remainingBudget < 0,
  }
}

export function formatCurrency(value: number): string {
  const amount = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
  return `${amount} FC`
}

export function formatDate(dateIso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateIso))
}

export function applyExpenseFilters(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  const normalizedSearch = filters.search.trim().toLocaleLowerCase()

  const filtered = expenses.filter((expense) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      expense.title.toLocaleLowerCase().includes(normalizedSearch) ||
      expense.description.toLocaleLowerCase().includes(normalizedSearch)
    const matchesCategory = filters.category === 'all' || expense.category === filters.category
    return matchesSearch && matchesCategory
  })

  const sorted = [...filtered]
  switch (filters.sort) {
    case 'date-asc':
      sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      break
    case 'cost-desc':
      sorted.sort((a, b) => b.totalCost - a.totalCost)
      break
    case 'cost-asc':
      sorted.sort((a, b) => a.totalCost - b.totalCost)
      break
    case 'title-asc':
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'fr'))
      break
    default:
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  return sorted
}

export function buildCategoryTotals(expenses: Expense[]): Array<{ category: Category; total: number }> {
  const totalsMap = new Map<Category, number>()
  for (const expense of expenses) {
    totalsMap.set(expense.category, roundCurrency((totalsMap.get(expense.category) ?? 0) + expense.totalCost))
  }

  return Array.from(totalsMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
}
