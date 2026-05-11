import { formatCurrency } from '../utils/calculations'

interface BudgetSummaryProps {
  initialBudget: number
  totalExpenses: number
  remainingBudget: number
  spentPercentage: number
}

export function BudgetSummary({
  initialBudget,
  totalExpenses,
  remainingBudget,
  spentPercentage,
}: BudgetSummaryProps) {
  return (
    <section className="summary-grid" aria-label="Resume budgetaire">
      <article className="summary-card">
        <h3>Budget initial</h3>
        <p>{formatCurrency(initialBudget)}</p>
      </article>
      <article className="summary-card">
        <h3>Total depenses</h3>
        <p>{formatCurrency(totalExpenses)}</p>
      </article>
      <article className={`summary-card ${remainingBudget < 0 ? 'danger' : ''}`}>
        <h3>Budget restant</h3>
        <p>{formatCurrency(remainingBudget)}</p>
      </article>
      <article className="summary-card">
        <h3>Taux de depense</h3>
        <p>{spentPercentage.toFixed(2)}%</p>
      </article>
    </section>
  )
}
