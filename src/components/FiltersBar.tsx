import { DEFAULT_CATEGORIES, type ExpenseFilters } from '../types/budget'

interface FiltersBarProps {
  filters: ExpenseFilters
  onChange: (filters: ExpenseFilters) => void
}

export function FiltersBar({ filters, onChange }: FiltersBarProps) {
  return (
    <section className="panel filters-panel">
      <div className="panel-header">
        <h2>Recherche et filtres</h2>
      </div>
      <div className="filters-grid">
        <label>
          Rechercher
          <input
            type="search"
            placeholder="Intitule ou description"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
          />
        </label>
        <label>
          Categorie
          <select
            value={filters.category}
            onChange={(event) =>
              onChange({
                ...filters,
                category: event.target.value as ExpenseFilters['category'],
              })
            }
          >
            <option value="all">Toutes</option>
            {DEFAULT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          Trier par
          <select
            value={filters.sort}
            onChange={(event) => onChange({ ...filters, sort: event.target.value as ExpenseFilters['sort'] })}
          >
            <option value="date-desc">Date (recent au plus ancien)</option>
            <option value="date-asc">Date (ancien au plus recent)</option>
            <option value="cost-desc">Cout (plus eleve)</option>
            <option value="cost-asc">Cout (plus faible)</option>
            <option value="title-asc">Intitule (A-Z)</option>
          </select>
        </label>
      </div>
    </section>
  )
}
