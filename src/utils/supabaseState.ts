import type { BudgetState } from '../types/budget'
import { supabase } from '../lib/supabase'
import { normalizeBudgetState } from './storage'

const TABLE_NAME = 'budget_sync'
const ROW_ID = 'global'

type BudgetSyncRow = {
  id: string
  payload: Partial<BudgetState>
}

export async function loadBudgetStateFromSupabase(): Promise<BudgetState | null> {
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id,payload')
    .eq('id', ROW_ID)
    .maybeSingle<BudgetSyncRow>()

  if (error) {
    throw error
  }

  if (!data?.payload) {
    return null
  }

  return normalizeBudgetState(data.payload)
}

export async function saveBudgetStateToSupabase(state: BudgetState): Promise<void> {
  if (!supabase) {
    return
  }

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert({ id: ROW_ID, payload: state }, { onConflict: 'id' })

  if (error) {
    throw error
  }
}
