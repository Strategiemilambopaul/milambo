import type { Expense } from '../types/budget'
import { buildCategoryTotals, formatCurrency } from '../utils/calculations'

interface CategoryBreakdownProps {
  expenses: Expense[]
}

export function CategoryBreakdown({ expenses }: CategoryBreakdownProps) {
  const categoryTotals = buildCategoryTotals(expenses)
  const maxValue = categoryTotals[0]?.total ?? 0

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Repartition par categorie</h2>
      </div>
      {categoryTotals.length === 0 ? (
        <p className="muted">Aucune donnee de depense disponible.</p>
      ) : (
        <ul className="category-list">
          {categoryTotals.map((item) => {
            const width = maxValue === 0 ? 0 : (item.total / maxValue) * 100
            return (
              <li key={item.category}>
                <div className="category-row">
                  <span>{item.category}</span>
                  <strong>{formatCurrency(item.total)}</strong>
                </div>
                <div className="bar-track" aria-hidden="true">
                  <div className="bar-fill" style={{ width: `${width}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
