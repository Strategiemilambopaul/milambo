import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { BudgetHistoryEntry, BudgetState, Expense, ExpenseFormValues } from '../types/budget'
import { isSupabaseConfigured } from '../lib/supabase'
import { computeBudgetSummary, computeExpenseTotal, roundCurrency } from '../utils/calculations'
import { createDefaultBudgetState, saveBudgetState } from '../utils/storage'
import { loadBudgetStateFromSupabase, saveBudgetStateToSupabase } from '../utils/supabaseState'

type BudgetAction =
  | { type: 'set-initial-budget'; payload: number }
  | { type: 'add-expense'; payload: ExpenseFormValues }
  | { type: 'update-expense'; payload: { expenseId: string; values: ExpenseFormValues } }
  | { type: 'delete-expense'; payload: { expenseId: string } }
  | { type: 'replace-state'; payload: BudgetState }

interface BudgetContextValue {
  state: BudgetState
  summary: ReturnType<typeof computeBudgetSummary>
  setInitialBudget: (value: number) => void
  addExpense: (values: ExpenseFormValues) => void
  updateExpense: (expenseId: string, values: ExpenseFormValues) => void
  deleteExpense: (expenseId: string) => void
}

const BudgetContext = createContext<BudgetContextValue | null>(null)
const MAX_HISTORY_ITEMS = 100

function createHistory(type: BudgetHistoryEntry['type'], message: string): BudgetHistoryEntry {
  return {
    id: crypto.randomUUID(),
    type,
    message,
    createdAt: new Date().toISOString(),
  }
}

function expenseFromValues(values: ExpenseFormValues, current?: Expense): Expense {
  const nowIso = new Date().toISOString()
  const normalizedUnitPrice = roundCurrency(Math.max(values.unitPrice, 0))
  const normalizedQuantity = Math.max(Math.floor(values.quantity || 1), 1)
  return {
    id: current?.id ?? crypto.randomUUID(),
    title: values.title.trim(),
    description: values.description.trim(),
    unitPrice: normalizedUnitPrice,
    quantity: normalizedQuantity,
    totalCost: computeExpenseTotal(normalizedUnitPrice, normalizedQuantity),
    category: values.category,
    createdAt: current?.createdAt ?? nowIso,
    updatedAt: nowIso,
  }
}

function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case 'set-initial-budget': {
      const nextBudget = roundCurrency(Math.max(action.payload, 0))
      const historyEntry = createHistory(
        'budget-update',
        `Budget initial mis a jour a ${nextBudget.toFixed(2)} FC.`,
      )
      return {
        ...state,
        initialBudget: nextBudget,
        history: [historyEntry, ...state.history].slice(0, MAX_HISTORY_ITEMS),
      }
    }
    case 'add-expense': {
      const expense = expenseFromValues(action.payload)
      const historyEntry = createHistory('expense-add', `Depense ajoutee: ${expense.title}.`)
      return {
        ...state,
        expenses: [expense, ...state.expenses],
        history: [historyEntry, ...state.history].slice(0, MAX_HISTORY_ITEMS),
      }
    }
    case 'update-expense': {
      const target = state.expenses.find((expense) => expense.id === action.payload.expenseId)
      if (!target) {
        return state
      }
      const updated = expenseFromValues(action.payload.values, target)
      const historyEntry = createHistory('expense-update', `Depense modifiee: ${updated.title}.`)
      return {
        ...state,
        expenses: state.expenses.map((expense) =>
          expense.id === action.payload.expenseId ? updated : expense,
        ),
        history: [historyEntry, ...state.history].slice(0, MAX_HISTORY_ITEMS),
      }
    }
    case 'delete-expense': {
      const target = state.expenses.find((expense) => expense.id === action.payload.expenseId)
      if (!target) {
        return state
      }
      const historyEntry = createHistory('expense-delete', `Depense supprimee: ${target.title}.`)
      return {
        ...state,
        expenses: state.expenses.filter((expense) => expense.id !== action.payload.expenseId),
        history: [historyEntry, ...state.history].slice(0, MAX_HISTORY_ITEMS),
      }
    }
    case 'replace-state':
      return action.payload
    default:
      return state
  }
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, undefined, createDefaultBudgetState)
  const [cloudReady, setCloudReady] = useState(false)
  const initialStateRef = useRef(state)

  useEffect(() => {
    let isMounted = true
    const syncFromCloud = async () => {
      if (!isSupabaseConfigured) {
        console.warn('Supabase non configure: synchronisation cloud indisponible.')
        if (isMounted) {
          setCloudReady(true)
        }
        return
      }

      try {
        const cloudState = await loadBudgetStateFromSupabase()
        if (!isMounted) {
          return
        }

        if (cloudState) {
          dispatch({ type: 'replace-state', payload: cloudState })
        } else {
          await saveBudgetStateToSupabase(initialStateRef.current)
        }
      } catch (error) {
        console.warn('Sync Supabase indisponible, sauvegarde locale temporaire.', error)
      } finally {
        if (isMounted) {
          setCloudReady(true)
        }
      }
    }

    syncFromCloud()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!cloudReady || !isSupabaseConfigured) {
      saveBudgetState(state)
      return
    }

    saveBudgetStateToSupabase(state).catch((error) => {
      console.warn('Echec de sauvegarde cloud Supabase.', error)
    })
    saveBudgetState(state)
  }, [cloudReady, state])

  const contextValue = useMemo<BudgetContextValue>(() => {
    const summary = computeBudgetSummary(state.initialBudget, state.expenses)

    return {
      state,
      summary,
      setInitialBudget: (value) => dispatch({ type: 'set-initial-budget', payload: value }),
      addExpense: (values) => dispatch({ type: 'add-expense', payload: values }),
      updateExpense: (expenseId, values) =>
        dispatch({ type: 'update-expense', payload: { expenseId, values } }),
      deleteExpense: (expenseId) => dispatch({ type: 'delete-expense', payload: { expenseId } }),
    }
  }, [state])

  return <BudgetContext.Provider value={contextValue}>{children}</BudgetContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBudget(): BudgetContextValue {
  const context = useContext(BudgetContext)
  if (!context) {
    throw new Error('useBudget doit etre utilise dans BudgetProvider')
  }
  return context
}
