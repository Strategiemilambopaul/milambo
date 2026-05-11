import { useEffect, useMemo, useState } from 'react'
import { BudgetAlert } from './components/BudgetAlert'
import { BudgetSummary } from './components/BudgetSummary'
import { CategoryBreakdown } from './components/CategoryBreakdown'
import { ExpenseForm } from './components/ExpenseForm'
import { ExpensesTable } from './components/ExpensesTable'
import { FiltersBar } from './components/FiltersBar'
import { HistoryPanel } from './components/HistoryPanel'
import { useBudget } from './context/BudgetContext'
import type { Expense, ExpenseFilters, ExpenseFormValues } from './types/budget'
import { applyExpenseFilters } from './utils/calculations'
import { exportExpensesToCsv, exportReportToPdfLikePrint } from './utils/export'

const defaultFilters: ExpenseFilters = {
  search: '',
  category: 'all',
  sort: 'date-desc',
}
const CASH_MANAGER = 'STRATEGIE MILAMBO PAUL'
const ACCESS_STORAGE_KEY = 'milambo_current_visitor_v1'
type VisitorRole = 'admin' | 'viewer'

interface VisitorAccess {
  name: string
  role: VisitorRole
  relation: string
}

const ALLOWED_VISITORS: VisitorAccess[] = [
  { name: 'STRATEGIE MILAMBO', role: 'admin', relation: 'Admin' },
  { name: 'MUTAMBA MILAMBO', role: 'viewer', relation: 'Papa' },
  { name: 'MILAMBO MUTAMBA', role: 'viewer', relation: 'Fils' },
  { name: 'ILUNGA KALENGA', role: 'viewer', relation: 'Maman' },
  { name: 'NYANDUE MILAMBO', role: 'viewer', relation: 'Fils aines' },
  { name: 'KAYEMBE MILAMBO', role: 'viewer', relation: 'Fille' },
  { name: 'MITONGA MILAMBO', role: 'viewer', relation: 'Fille' },
  { name: 'NATHALIE MILAMBO', role: 'viewer', relation: 'Fille ainee' },
  { name: 'BANZA MILAMBO', role: 'viewer', relation: 'Cadet' },
]
const HOUSE_FACETS = [
  '/maison/facette-01.png',
  '/maison/facette-02.png',
  '/maison/facette-03.png',
  '/maison/facette-04.png',
  '/maison/facette-05.png',
  '/maison/facette-06.png',
  '/maison/facette-07.png',
  '/maison/facette-08.png',
  '/maison/facette-09.png',
  '/maison/facette-10.png',
  '/maison/facette-11.png',
  '/maison/facette-12.png',
  '/maison/facette-13.png',
]
const HOME_BACKGROUNDS = HOUSE_FACETS.slice(0, 10)
const WORK_ABOVE_PLAN = [
  {
    title: 'Phase 1: Structure au-dessus',
    detail: 'Verifier poteaux, chainage, dalle et points de charge avant toute nouvelle extension.',
  },
  {
    title: 'Phase 2: Etancheite et securite',
    detail: 'Prevoir evacuation des eaux, traitement anti-infiltration et garde-corps temporaire.',
  },
  {
    title: 'Phase 3: Finitions et reseaux',
    detail: 'Planifier electricite, plafonds, carrelage et peinture avec budget dedie par zone.',
  },
]

function getInitialVisitorName(): string {
  if (typeof window === 'undefined') {
    return ALLOWED_VISITORS[0].name
  }
  const savedName = window.localStorage.getItem(ACCESS_STORAGE_KEY)
  const found = ALLOWED_VISITORS.find((visitor) => visitor.name === savedName)
  return found?.name ?? ALLOWED_VISITORS[0].name
}

function normalizePersonName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toUpperCase()
}

function App() {
  const { state, summary, setInitialBudget, addExpense, updateExpense, deleteExpense } = useBudget()
  const [draftBudget, setDraftBudget] = useState(String(state.initialBudget || 21500000))
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [filters, setFilters] = useState<ExpenseFilters>(defaultFilters)
  const [showHouseGallery, setShowHouseGallery] = useState(false)
  const [currentVisitorName, setCurrentVisitorName] = useState(getInitialVisitorName)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginNom, setLoginNom] = useState('')
  const [loginPostNom, setLoginPostNom] = useState('')
  const [loginError, setLoginError] = useState('')
  const [backgroundIndex, setBackgroundIndex] = useState(0)

  const currentVisitor = useMemo(
    () =>
      ALLOWED_VISITORS.find((visitor) => visitor.name === currentVisitorName) ?? ALLOWED_VISITORS[0],
    [currentVisitorName],
  )
  const canManage = currentVisitor.role === 'admin'

  const visibleExpenses = useMemo(
    () => applyExpenseFilters(state.expenses, filters),
    [filters, state.expenses],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(ACCESS_STORAGE_KEY, currentVisitor.name)
  }, [currentVisitor.name])

  useEffect(() => {
    if (isAuthenticated) {
      return
    }
    const timer = window.setInterval(() => {
      setBackgroundIndex((prev) => (prev + 1) % HOME_BACKGROUNDS.length)
    }, 3500)
    return () => window.clearInterval(timer)
  }, [isAuthenticated])

  const handleExpenseSubmit = (values: ExpenseFormValues) => {
    if (!canManage) {
      return
    }
    if (editingExpense) {
      updateExpense(editingExpense.id, values)
      setEditingExpense(null)
      return
    }
    addExpense(values)
  }

  const handleBudgetSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canManage) {
      return
    }
    setInitialBudget(Number(draftBudget))
  }

  const handleLoginSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const fullName = normalizePersonName(`${loginNom} ${loginPostNom}`)
    const matchedVisitor = ALLOWED_VISITORS.find((visitor) => visitor.name === fullName)

    if (!matchedVisitor) {
      setLoginError('Nom non reconnu. Verifie les informations puis reessaie.')
      return
    }

    setCurrentVisitorName(matchedVisitor.name)
    setIsAuthenticated(true)
    setLoginError('')
  }

  if (!isAuthenticated) {
    return (
      <main
        className="welcome-screen"
        style={{ backgroundImage: `url(${HOME_BACKGROUNDS[backgroundIndex]})` }}
      >
        <div className="welcome-overlay">
          <section className="welcome-card">
            <p className="eyebrow">Maison Milambo</p>
            <h1>Espace de suivi budgetaire</h1>
            <p className="subtitle">
              Entrez votre nom et postnom pour acceder au site et consulter le suivi du chantier.
            </p>
            <form className="welcome-form" onSubmit={handleLoginSubmit}>
              <label>
                Nom
                <input
                  type="text"
                  value={loginNom}
                  onChange={(event) => setLoginNom(event.target.value)}
                  placeholder="Ex: MILAMBO"
                  required
                />
              </label>
              <label>
                Postnom
                <input
                  type="text"
                  value={loginPostNom}
                  onChange={(event) => setLoginPostNom(event.target.value)}
                  placeholder="Ex: MUTAMBA"
                  required
                />
              </label>
              <button type="submit">Valider et entrer</button>
            </form>
            {loginError ? <p className="login-error">{loginError}</p> : null}
            <p className="muted">Arriere-plan dynamique: {backgroundIndex + 1}/10</p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="hero-header">
        <div>
          <p className="eyebrow">Projet Milambo</p>
          <h1>Gestion budgetaire de la construction</h1>
          <p className="subtitle">
            Suivi en temps reel des depenses pour la construction de l&apos;elevation de la maison.
          </p>
          <p className="subtitle">
            Gerant de la caisse: <strong>{CASH_MANAGER}</strong>
          </p>
          <p className="subtitle">
            Connecte: <strong>{currentVisitor.name}</strong> ({canManage ? 'Admin' : 'Lecture seule'})
          </p>
        </div>
        {canManage ? (
          <form className="budget-form" onSubmit={handleBudgetSubmit}>
            <label>
              Budget initial (FC)
              <input
                type="number"
                min={0}
                step="0.01"
                value={draftBudget}
                onChange={(event) => setDraftBudget(event.target.value)}
                placeholder="Ex: 21500000"
              />
            </label>
            <button type="submit">Mettre a jour</button>
          </form>
        ) : (
          <section className="panel budget-readonly">
            <p className="muted">
              Seul <strong>STRATEGIE MILAMBO</strong> peut initialiser ou modifier le budget.
            </p>
          </section>
        )}
      </header>

      <BudgetAlert initialBudget={state.initialBudget} remainingBudget={summary.remainingBudget} />

      <BudgetSummary
        initialBudget={state.initialBudget}
        totalExpenses={summary.totalExpenses}
        remainingBudget={summary.remainingBudget}
        spentPercentage={summary.spentPercentage}
      />

      <section className="project-vision">
        <article className="panel vision-card">
          <div>
            <h2>Theme architectural de la maison Milambo</h2>
            <p className="muted">
              Style moderne avec ferronnerie decorative, marbre contraste et eclairage chaud. Cette
              galerie montre les facettes reelles pour guider les depenses et les prochaines finitions.
            </p>
          </div>
          <img
            src="/maison/facette-13.png"
            alt="Facade principale de la maison Milambo"
            className="vision-cover"
            loading="lazy"
          />
        </article>
        <article className="panel">
          <div className="panel-header">
            <h2>Plan de travail au-dessus</h2>
          </div>
          <div className="work-plan-grid">
            {WORK_ABOVE_PLAN.map((step) => (
              <div key={step.title} className="work-plan-card">
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Presentation de la maison</h2>
          <span>{HOUSE_FACETS.length} photos disponibles</span>
        </div>
        <div className="actions-row">
          <button
            type="button"
            className="secondary"
            onClick={() => setShowHouseGallery((prev) => !prev)}
          >
            {showHouseGallery ? 'Masquer la maison' : 'Voir la maison'}
          </button>
        </div>
        {showHouseGallery ? (
          <div className="facets-grid">
            {HOUSE_FACETS.map((imagePath, index) => (
              <figure className="facet-item" key={imagePath}>
                <img src={imagePath} alt={`Facette maison Milambo ${index + 1}`} loading="lazy" />
              </figure>
            ))}
          </div>
        ) : (
          <p className="muted gallery-hint">
            Clique sur le bouton pour afficher toutes les facettes de la maison.
          </p>
        )}
      </section>

      <section className="top-grid">
        {canManage ? (
          <div id="expense-form-anchor">
            <ExpenseForm
              key={editingExpense?.id ?? 'new-expense'}
              onSubmit={handleExpenseSubmit}
              editingExpense={editingExpense}
              onCancelEdit={() => setEditingExpense(null)}
            />
          </div>
        ) : (
          <section className="panel">
            <div className="panel-header">
              <h2>Mode lecture seule</h2>
            </div>
            <p className="muted">
              Vous pouvez consulter les depenses, les montants et la progression du budget. Les
              ajouts, modifications et suppressions sont reserves a l&apos;administrateur.
            </p>
          </section>
        )}
        <div className="side-stack">
          <FiltersBar filters={filters} onChange={setFilters} />
          <CategoryBreakdown expenses={state.expenses} />
          <section className="panel">
            <div className="panel-header">
              <h2>Exports</h2>
            </div>
            <div className="actions-row">
              <button type="button" className="secondary" onClick={() => exportExpensesToCsv(state.expenses)}>
                Export Excel (CSV)
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  exportReportToPdfLikePrint(
                    state.initialBudget,
                    summary.totalExpenses,
                    summary.remainingBudget,
                    state.expenses,
                    CASH_MANAGER,
                  )
                }
              >
                Export PDF
              </button>
            </div>
          </section>
        </div>
      </section>

      <ExpensesTable
        expenses={visibleExpenses}
        canManage={canManage}
        onEdit={(expense) => {
          if (!canManage) {
            return
          }
          setEditingExpense(expense)
          document
            .getElementById('expense-form-anchor')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
        onDelete={(expenseId) => {
          if (!canManage) {
            return
          }
          deleteExpense(expenseId)
          if (editingExpense?.id === expenseId) {
            setEditingExpense(null)
          }
        }}
      />

      {canManage ? <HistoryPanel history={state.history} /> : null}
    </main>
  )
}

export default App
