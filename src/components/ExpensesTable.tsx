import type { Expense } from '../types/budget'
import { formatCurrency, formatDate } from '../utils/calculations'

interface ExpensesTableProps {
  expenses: Expense[]
  canManage: boolean
  onEdit?: (expense: Expense) => void
  onDelete?: (expenseId: string) => void
}

export function ExpensesTable({ expenses, canManage, onEdit, onDelete }: ExpensesTableProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Liste des depenses</h2>
        <span>{expenses.length} element(s)</span>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Intitule</th>
              <th>Description</th>
              <th>Categorie</th>
              <th>Prix unitaire</th>
              <th>Quantite</th>
              <th>Cout total</th>
              <th>Date d'ajout</th>
              {canManage ? <th>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 8 : 7} className="empty-cell">
                  Aucune depense pour le moment.
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.title}</td>
                  <td>{expense.description || '-'}</td>
                  <td>{expense.category}</td>
                  <td>{formatCurrency(expense.unitPrice)}</td>
                  <td>{expense.quantity}</td>
                  <td>{formatCurrency(expense.totalCost)}</td>
                  <td>{formatDate(expense.createdAt)}</td>
                  {canManage ? (
                    <td className="actions-cell">
                      <button type="button" className="secondary" onClick={() => onEdit?.(expense)}>
                        Modifier
                      </button>
                      <button type="button" className="danger" onClick={() => onDelete?.(expense.id)}>
                        Supprimer
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
