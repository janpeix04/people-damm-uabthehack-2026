import { Filter, RotateCcw, Search, X } from 'lucide-react'
import type { AnalyticsFormConfig, FilterOptions, ShiftType } from '../../data/surveyAnalytics'
import type { ChannelKey, ZoneKey } from '../../data/types'

const ZONES_LIST: { key: ZoneKey; label: string }[] = [
  { key: 'envasat', label: 'Envasat' },
  { key: 'logistica', label: 'Logística' },
  { key: 'coccio', label: 'Sala de cocció' },
  { key: 'malta', label: 'Recepció de malta' },
  { key: 'fermentacio', label: 'Fermentació' },
  { key: 'oficines', label: 'Oficines' },
  { key: 'comercial', label: 'Comercial' },
  { key: 'manteniment', label: 'Manteniment' },
]

const SHIFTS_LIST: { key: ShiftType; label: string }[] = [
  { key: 'mati', label: 'Matí' },
  { key: 'tarda', label: 'Tarda' },
  { key: 'nit', label: 'Nit' },
  { key: 'flexible', label: 'Central / Flexible' },
]

const CHANNELS_LIST: { key: ChannelKey; label: string }[] = [
  { key: 'qr', label: 'QR a planta' },
  { key: 'app', label: 'App Treballador' },
  { key: 'teams', label: 'Teams' },
  { key: 'email', label: 'Correu' },
  { key: 'placa', label: 'La Plaça' },
]

export function AnalyticsFilterBar({
  forms,
  selectedFormId,
  onSelectForm,
  filters,
  onChangeFilters,
  totalMatching,
  totalAvailable,
}: {
  forms: AnalyticsFormConfig[]
  selectedFormId: string
  onSelectForm: (id: string) => void
  filters: FilterOptions
  onChangeFilters: (f: FilterOptions) => void
  totalMatching: number
  totalAvailable: number
}) {
  const currentForm = forms.find(f => f.id === selectedFormId) || forms[0]

  const update = (patch: Partial<FilterOptions>) => {
    onChangeFilters({ ...filters, ...patch })
  }

  const resetFilters = () => {
    onChangeFilters({
      dateRange: 'all',
      zone: 'all',
      shift: 'all',
      channel: 'all',
      sentiment: 'all',
      searchQuery: '',
    })
  }

  const hasActiveFilters =
    (filters.dateRange && filters.dateRange !== 'all') ||
    (filters.zone && filters.zone !== 'all') ||
    (filters.shift && filters.shift !== 'all') ||
    (filters.channel && filters.channel !== 'all') ||
    (filters.sentiment && filters.sentiment !== 'all') ||
    (filters.searchQuery && filters.searchQuery.trim().length > 0)

  return (
    <section aria-label="Filtres d'analítica" className="card p-4 sm:p-5 flex flex-col gap-4 bg-paper shadow-sm">
      {/* 1. Selector principal de Formulari */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-line pb-4">
        <div className="min-w-0 flex-1">
          <label htmlFor="form-select" className="eyebrow block mb-1">
            Formulari seleccionat
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              id="form-select"
              value={selectedFormId}
              onChange={e => onSelectForm(e.target.value)}
              className="input !text-[15px] font-bold max-w-md bg-cream cursor-pointer"
            >
              {forms.map(f => (
                <option key={f.id} value={f.id}>
                  {f.title} ({f.responses} respostes) · {f.category}
                </option>
              ))}
            </select>

            <span className="chip bg-red-soft text-red-dk font-bold">{currentForm.category}</span>
            <span className="text-xs text-ink-muted">
              {currentForm.questions.length} preguntes · Objectiu: {currentForm.target}
            </span>
          </div>
        </div>

        {/* Comptador de respostes filtrades */}
        <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
          <span className="text-xs font-semibold text-ink-muted">Mostra activa:</span>
          <div className="rounded-[12px] bg-cream px-3 py-1.5 border border-line text-xs font-bold text-ink tabular-nums flex items-center gap-1.5">
            <span className="text-red font-extrabold text-sm">{totalMatching}</span>
            <span className="text-ink-muted">/ {totalAvailable} respostes</span>
            {hasActiveFilters && (
              <span className="text-[10.5px] bg-white px-1.5 py-0.5 rounded text-ink-soft">
                {Math.round((totalMatching / Math.max(1, totalAvailable)) * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Filtres interactius (Dates, Zona, Torn, Canal, Sentiment) */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 items-end">
        {/* Dates */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-dates" className="eyebrow">
            Període
          </label>
          <select
            id="filter-dates"
            value={filters.dateRange || 'all'}
            onChange={e => update({ dateRange: e.target.value as FilterOptions['dateRange'] })}
            className="input !text-xs font-semibold bg-white"
          >
            <option value="all">Tot l’històric</option>
            <option value="7d">Últims 7 dies</option>
            <option value="30d">Últims 30 dies</option>
            <option value="90d">Últim trimestre</option>
          </select>
        </div>

        {/* Zona / Planta */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-zone" className="eyebrow">
            Zona / Planta
          </label>
          <select
            id="filter-zone"
            value={filters.zone || 'all'}
            onChange={e => update({ zone: e.target.value as FilterOptions['zone'] })}
            className="input !text-xs font-semibold bg-white"
          >
            <option value="all">Totes les zones ({ZONES_LIST.length})</option>
            {ZONES_LIST.map(z => (
              <option key={z.key} value={z.key}>
                {z.label}
              </option>
            ))}
          </select>
        </div>

        {/* Torn */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-shift" className="eyebrow">
            Torn laboral
          </label>
          <select
            id="filter-shift"
            value={filters.shift || 'all'}
            onChange={e => update({ shift: e.target.value as FilterOptions['shift'] })}
            className="input !text-xs font-semibold bg-white"
          >
            <option value="all">Tots els torns</option>
            {SHIFTS_LIST.map(s => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Canal */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-channel" className="eyebrow">
            Canal de difusió
          </label>
          <select
            id="filter-channel"
            value={filters.channel || 'all'}
            onChange={e => update({ channel: e.target.value as FilterOptions['channel'] })}
            className="input !text-xs font-semibold bg-white"
          >
            <option value="all">Tots els canals</option>
            {CHANNELS_LIST.map(c => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sentiment */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-sentiment" className="eyebrow">
            Sentiment
          </label>
          <select
            id="filter-sentiment"
            value={filters.sentiment || 'all'}
            onChange={e => update({ sentiment: e.target.value as FilterOptions['sentiment'] })}
            className="input !text-xs font-semibold bg-white"
          >
            <option value="all">Tots els tons</option>
            <option value="positiu">Positiu</option>
            <option value="neutre">Neutre</option>
            <option value="negatiu">Negatiu / Crític</option>
          </select>
        </div>

        {/* Cerca lliure */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-search" className="eyebrow">
            Cerca paraules
          </label>
          <div className="relative">
            <input
              id="filter-search"
              type="text"
              placeholder="ex. calor, torn..."
              value={filters.searchQuery || ''}
              onChange={e => update({ searchQuery: e.target.value })}
              className="input !text-xs pr-7 bg-white"
            />
            {filters.searchQuery ? (
              <button
                type="button"
                onClick={() => update({ searchQuery: '' })}
                className="absolute right-2 top-2.5 text-ink-muted hover:text-ink"
                title="Esborrar cerca"
              >
                <X size={13} />
              </button>
            ) : (
              <Search size={13} className="absolute right-2.5 top-3 text-ink-muted pointer-events-none" />
            )}
          </div>
        </div>
      </div>

      {/* 3. Píndoles de filtres actius & botó de reset */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-line/60 text-xs">
          <span className="font-semibold text-ink-muted flex items-center gap-1">
            <Filter size={13} /> Filtres aplicats:
          </span>

          {filters.dateRange && filters.dateRange !== 'all' && (
            <span className="chip bg-cream text-ink flex items-center gap-1">
              Període: {filters.dateRange}
              <button onClick={() => update({ dateRange: 'all' })}>
                <X size={12} />
              </button>
            </span>
          )}

          {filters.zone && filters.zone !== 'all' && (
            <span className="chip bg-cream text-ink flex items-center gap-1">
              Zona: {ZONES_LIST.find(z => z.key === filters.zone)?.label}
              <button onClick={() => update({ zone: 'all' })}>
                <X size={12} />
              </button>
            </span>
          )}

          {filters.shift && filters.shift !== 'all' && (
            <span className="chip bg-cream text-ink flex items-center gap-1">
              Torn: {SHIFTS_LIST.find(s => s.key === filters.shift)?.label}
              <button onClick={() => update({ shift: 'all' })}>
                <X size={12} />
              </button>
            </span>
          )}

          {filters.channel && filters.channel !== 'all' && (
            <span className="chip bg-cream text-ink flex items-center gap-1">
              Canal: {CHANNELS_LIST.find(c => c.key === filters.channel)?.label}
              <button onClick={() => update({ channel: 'all' })}>
                <X size={12} />
              </button>
            </span>
          )}

          {filters.sentiment && filters.sentiment !== 'all' && (
            <span className="chip bg-cream text-ink flex items-center gap-1">
              Sentiment: {filters.sentiment}
              <button onClick={() => update({ sentiment: 'all' })}>
                <X size={12} />
              </button>
            </span>
          )}

          {filters.searchQuery && (
            <span className="chip bg-cream text-ink flex items-center gap-1">
              Cerca: &quot;{filters.searchQuery}&quot;
              <button onClick={() => update({ searchQuery: '' })}>
                <X size={12} />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={resetFilters}
            className="ml-auto inline-flex items-center gap-1 font-bold text-red-dk hover:underline cursor-pointer"
          >
            <RotateCcw size={12} />
            Netejar tots els filtres
          </button>
        </div>
      )}
    </section>
  )
}
