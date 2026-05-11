import { formatCurrency } from '../utils/calculations'

interface BudgetAlertProps {
  initialBudget: number
  remainingBudget: number
}

export function BudgetAlert({ initialBudget, remainingBudget }: BudgetAlertProps) {
  if (initialBudget <= 0) {
    return (
      <section className="alert warning">
        Definis un budget initial pour activer le suivi financier.
      </section>
    )
  }

  if (remainingBudget < 0) {
    return (
      <section className="alert danger">
        Budget depasse de {formatCurrency(Math.abs(remainingBudget))}. Ajuste les depenses.
      </section>
    )
  }

  const threshold = initialBudget * 0.1
  if (remainingBudget <= threshold) {
    return (
      <section className="alert warning">
        Attention: il ne reste que {formatCurrency(remainingBudget)} sur le budget.
      </section>
    )
  }

  return (
    <section className="alert success">
      Budget sous controle. Solde actuel: {formatCurrency(remainingBudget)}.
    </section>
  )
}
