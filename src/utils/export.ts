import type { Expense } from '../types/budget'
import { formatCurrency, formatDate } from './calculations'

function escapeCsvCell(value: string): string {
  const safe = value.replace(/"/g, '""')
  return `"${safe}"`
}

export function exportExpensesToCsv(expenses: Expense[]): void {
  const headers = [
    'Intitule',
    'Description',
    'Categorie',
    'Prix unitaire',
    'Quantite',
    'Cout total',
    'Date ajout',
  ]

  const rows = expenses.map((expense) =>
    [
      expense.title,
      expense.description,
      expense.category,
      String(expense.unitPrice),
      String(expense.quantity),
      String(expense.totalCost),
      expense.createdAt,
    ]
      .map((cell) => escapeCsvCell(cell))
      .join(';'),
  )

  const csvContent = [headers.join(';'), ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `milambo-depenses-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()

  window.URL.revokeObjectURL(url)
}

export function exportReportToPdfLikePrint(
  initialBudget: number,
  totalExpenses: number,
  remainingBudget: number,
  expenses: Expense[],
  cashManager: string,
): void {
  const reportWindow = window.open('', '_blank', 'width=900,height=700')
  if (!reportWindow) {
    return
  }

  const rows = expenses
    .map(
      (expense) => `
        <tr>
          <td>${expense.title}</td>
          <td>${expense.category}</td>
          <td>${formatCurrency(expense.unitPrice)}</td>
          <td>${expense.quantity}</td>
          <td>${formatCurrency(expense.totalCost)}</td>
          <td>${formatDate(expense.createdAt)}</td>
        </tr>
      `,
    )
    .join('')

  reportWindow.document.write(`
    <html>
      <head>
        <title>Rapport budget Milambo</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #17233c; }
          h1 { margin: 0 0 8px; }
          .muted { color: #60708f; margin-bottom: 16px; }
          .cards { display: flex; gap: 12px; margin-bottom: 16px; }
          .card { border: 1px solid #d7def0; border-radius: 10px; padding: 12px; min-width: 180px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #d7def0; padding: 8px; text-align: left; font-size: 13px; }
          th { background: #f4f7ff; }
        </style>
      </head>
      <body>
        <h1>Budget Construction Maison Milambo</h1>
        <div class="muted">Export du ${formatDate(new Date().toISOString())}</div>
        <div class="muted">Gerant de la caisse: <strong>${cashManager}</strong></div>
        <div class="cards">
          <div class="card"><strong>Budget initial</strong><br/>${formatCurrency(initialBudget)}</div>
          <div class="card"><strong>Total depenses</strong><br/>${formatCurrency(totalExpenses)}</div>
          <div class="card"><strong>Budget restant</strong><br/>${formatCurrency(remainingBudget)}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Intitule</th>
              <th>Categorie</th>
              <th>Prix unitaire</th>
              <th>Quantite</th>
              <th>Cout total</th>
              <th>Date ajout</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="6">Aucune depense</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `)

  reportWindow.document.close()
  reportWindow.focus()
  reportWindow.print()
}
