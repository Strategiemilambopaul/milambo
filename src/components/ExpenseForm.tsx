import { useMemo, useState } from 'react'
import { DEFAULT_CATEGORIES, type Expense, type ExpenseFormValues } from '../types/budget'
import { computeExpenseTotal } from '../utils/calculations'

interface ExpenseFormProps {
  onSubmit: (values: ExpenseFormValues) => void
  editingExpense: Expense | null
  onCancelEdit: () => void
}

const initialForm: ExpenseFormValues = {
  title: '',
  description: '',
  unitPrice: 0,
  quantity: 1,
  category: 'Planche',
}

export function ExpenseForm({ onSubmit, editingExpense, onCancelEdit }: ExpenseFormProps) {
  const [values, setValues] = useState<ExpenseFormValues>(() =>
    editingExpense
      ? {
          title: editingExpense.title,
          description: editingExpense.description,
          unitPrice: editingExpense.unitPrice,
          quantity: editingExpense.quantity,
          category: editingExpense.category,
        }
      : initialForm,
  )

  const totalPreview = useMemo(
    () => computeExpenseTotal(values.unitPrice || 0, values.quantity || 1),
    [values.quantity, values.unitPrice],
  )

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!values.title.trim()) {
      return
    }
    onSubmit(values)
    setValues(initialForm)
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{editingExpense ? 'Modifier une depense' : 'Ajouter une depense'}</h2>
      </div>
      <form className="expense-form" onSubmit={handleSubmit}>
        <label>
          Intitule
          <input
            type="text"
            value={values.title}
            onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
        </label>
        <label>
          Description
          <textarea
            rows={3}
            value={values.description}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, description: event.target.value }))
            }
          />
        </label>
        <div className="form-row">
          <label>
            Prix unitaire
            <input
              type="number"
              min={0}
              step="0.01"
              value={values.unitPrice}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  unitPrice: Number(event.target.value),
                }))
              }
              required
            />
          </label>
          <label>
            Quantite
            <input
              type="number"
              min={1}
              step="1"
              value={values.quantity}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  quantity: Number(event.target.value),
                }))
              }
              required
            />
          </label>
          <label>
            Categorie
            <select
              value={values.category}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  category: event.target.value as ExpenseFormValues['category'],
                }))
              }
            >
              {DEFAULT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="cost-preview">Cout total calcule: {totalPreview.toFixed(2)} FC</p>
        <div className="actions-row">
          <button type="submit">{editingExpense ? 'Enregistrer' : 'Ajouter'}</button>
          {editingExpense ? (
            <button type="button" className="secondary" onClick={onCancelEdit}>
              Annuler
            </button>
          ) : null}
        </div>
      </form>
    </section>
  )
}
