import type { BudgetHistoryEntry } from '../types/budget'
import { formatDate } from '../utils/calculations'

interface HistoryPanelProps {
  history: BudgetHistoryEntry[]
}

export function HistoryPanel({ history }: HistoryPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Historique des modifications</h2>
      </div>
      {history.length === 0 ? (
        <p className="muted">Aucune modification enregistree.</p>
      ) : (
        <ul className="history-list">
          {history.slice(0, 12).map((item) => (
            <li key={item.id}>
              <p>{item.message}</p>
              <small>{formatDate(item.createdAt)}</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
