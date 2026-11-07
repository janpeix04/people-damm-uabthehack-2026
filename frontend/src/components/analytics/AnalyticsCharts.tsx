import { useState } from 'react'
import { cn } from '../ui'

// ---------------------------------------------------------------------------
// 1. DONUT CHART (Gràfic circular interactiu)
// ---------------------------------------------------------------------------

export interface DonutSegment {
  key: string
  label: string
  value: number
  color: string
}

export function DonutChart({
  data,
  size = 180,
  strokeWidth = 26,
  centerLabel,
  centerValue,
  unit = '',
  className,
}: {
  data: DonutSegment[]
  size?: number
  strokeWidth?: number
  centerLabel?: string
  centerValue?: string | number
  unit?: string
  className?: string
}) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const total = data.reduce((a, b) => a + b.value, 0)
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  let currentAngle = -90 // Start at top

  if (total === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-4 text-center', className)}>
        <div className="w-24 h-24 rounded-full border-4 border-dashed border-line grid place-items-center text-xs text-ink-muted">
          Sense dades
        </div>
      </div>
    )
  }

  const activeSegment = hoveredKey ? data.find(d => d.key === hoveredKey) : null
  const displayVal = activeSegment ? activeSegment.value : (centerValue ?? total)
  const displayLbl = activeSegment ? activeSegment.label : (centerLabel ?? 'Total')
  const displayPct = activeSegment && total > 0 ? Math.round((activeSegment.value / total) * 100) : null

  return (
    <div className={cn('flex flex-col sm:flex-row items-center gap-5', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform rotate-0">
          {data.map(seg => {
            if (seg.value === 0) return null
            const fraction = seg.value / total
            const dashLength = fraction * circumference
            const dashOffset = -((currentAngle + 90) / 360) * circumference
            currentAngle += fraction * 360

            const isHovered = hoveredKey === seg.key
            return (
              <circle
                key={seg.key}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                className="transition-all duration-300 cursor-pointer origin-center"
                style={{
                  strokeLinecap: 'butt',
                  opacity: hoveredKey && !isHovered ? 0.45 : 1,
                }}
                onMouseEnter={() => setHoveredKey(seg.key)}
                onMouseLeave={() => setHoveredKey(null)}
              />
            )
          })}
        </svg>

        {/* Etiqueta central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="serif text-2xl font-normal leading-none text-ink tabular-nums">
            {displayVal}
            {unit}
          </span>
          <span className="text-[11px] font-bold text-ink-muted truncate max-w-[90px] mt-0.5">
            {displayPct !== null ? `${displayPct}% · ` : ''}
            {displayLbl}
          </span>
        </div>
      </div>

      {/* Llegenda interactiva */}
      <div className="flex flex-col gap-1.5 min-w-[150px] w-full text-xs">
        {data.map(seg => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0
          const isHovered = hoveredKey === seg.key
          return (
            <button
              key={seg.key}
              type="button"
              onMouseEnter={() => setHoveredKey(seg.key)}
              onMouseLeave={() => setHoveredKey(null)}
              className={cn(
                'flex items-center justify-between gap-2.5 px-2 py-1 rounded-[8px] text-left transition',
                isHovered ? 'bg-cream-dk font-bold' : 'hover:bg-cream',
              )}
            >
              <div className="flex items-center gap-2 truncate min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="truncate text-ink-soft">{seg.label}</span>
              </div>
              <div className="shrink-0 tabular-nums text-ink-muted text-[11.5px]">
                <strong className="text-ink font-semibold">{seg.value}</strong> ({pct}%)
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 2. HORIZONTAL BAR CHART (Gràfic de barres horitzontals)
// ---------------------------------------------------------------------------

export interface BarItem {
  key: string
  label: string
  value: number
  total?: number
  pct?: number
  color?: string
  sublabel?: string
}

export function HorizontalBarChart({
  items,
  maxVal,
  barHeight = 'h-3.5',
  showPct = true,
  className,
}: {
  items: BarItem[]
  maxVal?: number
  barHeight?: string
  showPct?: boolean
  className?: string
}) {
  const calculatedMax = maxVal ?? Math.max(...items.map(i => i.value), 1)

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {items.map(item => {
        const pct = item.pct ?? (calculatedMax > 0 ? Math.round((item.value / calculatedMax) * 100) : 0)
        const barColor = item.color || '#C8102E'

        return (
          <div key={item.key} className="flex flex-col gap-1 text-[13px]">
            <div className="flex justify-between items-baseline gap-2">
              <span className="font-medium text-ink truncate">{item.label}</span>
              <div className="shrink-0 text-right tabular-nums text-ink-muted text-xs">
                <strong className="text-ink font-bold">{item.value}</strong>
                {showPct && <span className="ml-1 text-[11px] text-ink-muted">({pct}%)</span>}
              </div>
            </div>

            <div className={cn('w-full rounded-full bg-cream-dk overflow-hidden relative', barHeight)}>
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(0, pct))}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>
            {item.sublabel && <div className="text-[11px] text-ink-muted">{item.sublabel}</div>}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 3. GROUPED BAR CHART (Comparativa per columnes o grups)
// ---------------------------------------------------------------------------

export function GroupedBarChart({
  categories,
  series,
  height = 180,
  maxScore = 10,
  className,
}: {
  categories: string[]
  series: { label: string; color: string; values: number[] }[]
  height?: number
  maxScore?: number
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Llegenda */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        {series.map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: s.color }} />
            <span className="text-ink-soft">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Àrea del gràfic */}
      <div className="relative border-b border-line flex items-end justify-between pt-6 px-2 gap-2" style={{ height }}>
        {/* Línies de referència horitzontals */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="w-full border-t border-dashed border-ink/20" />
          <div className="w-full border-t border-dashed border-ink/20" />
          <div className="w-full border-t border-dashed border-ink/20" />
        </div>

        {categories.map((cat, cIdx) => (
          <div key={cat} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <div className="flex items-end justify-center gap-1 w-full h-[85%]">
              {series.map(s => {
                const val = s.values[cIdx] || 0
                const pct = Math.min(100, (val / maxScore) * 100)
                return (
                  <div
                    key={s.label}
                    className="w-full max-w-[20px] rounded-t-[5px] transition-all duration-500 hover:opacity-85 relative group"
                    style={{
                      height: `${Math.max(4, pct)}%`,
                      backgroundColor: s.color,
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-ink text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10 font-bold tabular-nums">
                      {val.toFixed(1)}
                    </div>
                  </div>
                )
              })}
            </div>
            <span className="text-[11px] text-ink-muted truncate max-w-[75px] text-center" title={cat}>
              {cat}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 4. TIMELINE CHART (Línia temporal de participació i evolució)
// ---------------------------------------------------------------------------

export function TimelineChart({
  data,
  height = 160,
  className,
}: {
  data: { date: string; count: number; cumulative: number; avgScore: number }[]
  height?: number
  className?: string
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (data.length === 0) {
    return <div className="text-center py-8 text-xs text-ink-muted">Sense registres suficients en el període</div>
  }

  const maxCount = Math.max(...data.map(d => d.count), 5)
  const paddingX = 24
  const paddingY = 20
  const width = 500
  const chartW = width - paddingX * 2
  const chartH = height - paddingY * 2

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * chartW
    const y = paddingY + chartH - (d.count / maxCount) * chartH
    return { x, y, ...d }
  })

  const pathD = points.length === 1
    ? `M ${points[0].x} ${points[0].y} h 10`
    : `M ${points[0].x} ${points[0].y} ` +
      points
        .slice(1)
        .map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ')

  const areaD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : ''

  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1]

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex justify-between items-baseline text-xs text-ink-muted">
        <span>Respostes rebudes per dia</span>
        {activePoint && (
          <span className="font-bold text-ink">
            {activePoint.date}: <span className="text-red font-extrabold">{activePoint.count} respostes</span> · Mitjana:{' '}
            <span className="font-extrabold">{activePoint.avgScore.toFixed(1)}/10</span>
          </span>
        )}
      </div>

      <div className="relative w-full overflow-hidden" style={{ height }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C8102E" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#C8102E" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Línies guia */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#E6DCCF" strokeDasharray="3 3" />
          <line
            x1={paddingX}
            y1={paddingY + chartH / 2}
            x2={width - paddingX}
            y2={paddingY + chartH / 2}
            stroke="#E6DCCF"
            strokeDasharray="3 3"
          />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#E6DCCF" />

          {/* Àrea amb gradient */}
          {areaD && <path d={areaD} fill="url(#timelineGrad)" />}

          {/* Línia principal */}
          <path d={pathD} fill="none" stroke="#C8102E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Punts interactius */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoverIndex === i ? 5.5 : 3.5}
                fill={hoverIndex === i ? '#9E0C24' : '#FFFDF9'}
                stroke="#C8102E"
                strokeWidth={hoverIndex === i ? 3 : 2}
                className="transition-all cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="flex justify-between text-[11px] text-ink-muted px-1">
        <span>{data[0]?.date}</span>
        <span>{data[Math.floor(data.length / 2)]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 5. RADAR CHART (Gràfic de radar / teranyina de dimensions)
// ---------------------------------------------------------------------------

export function RadarChart({
  data,
  size = 230,
  className,
}: {
  data: { dimension: string; score: number; benchmark: number }[]
  size?: number
  className?: string
}) {
  if (data.length < 3) {
    return <div className="text-center py-6 text-xs text-ink-muted">Es necessiten almenys 3 dimensions per al radar</div>
  }

  const center = size / 2
  const maxR = size * 0.38
  const n = data.length
  const angleStep = (2 * Math.PI) / n

  // Eixos i coordenades
  const levels = [0.25, 0.5, 0.75, 1.0]

  // Punts polígon cohort actual (escala 0-10)
  const currentPoints = data.map((d, i) => {
    const r = (Math.min(10, Math.max(0, d.score)) / 10) * maxR
    const angle = i * angleStep - Math.PI / 2
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  })

  // Punts benchmark
  const benchPoints = data.map((d, i) => {
    const r = (Math.min(10, Math.max(0, d.benchmark)) / 10) * maxR
    const angle = i * angleStep - Math.PI / 2
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  })

  const currentPath = currentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'
  const benchPath = benchPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Cercles / polígons de nivell */}
          {levels.map((lvl, lIdx) => {
            const r = lvl * maxR
            const poly = Array.from({ length: n }).map((_, i) => {
              const angle = i * angleStep - Math.PI / 2
              return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
            }).join(' ')
            return (
              <polygon
                key={lIdx}
                points={poly}
                fill="none"
                stroke="#E6DCCF"
                strokeWidth="1"
                strokeDasharray={lvl === 1.0 ? 'none' : '2 2'}
              />
            )
          })}

          {/* Radis des del centre */}
          {data.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2
            const endX = center + maxR * Math.cos(angle)
            const endY = center + maxR * Math.sin(angle)
            return <line key={i} x1={center} y1={center} x2={endX} y2={endY} stroke="#E6DCCF" strokeWidth="1" />
          })}

          {/* Polígon Benchmark */}
          <path d={benchPath} fill="none" stroke="#5C534E" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

          {/* Polígon Actual */}
          <path d={currentPath} fill="#C8102E" fillOpacity="0.22" stroke="#C8102E" strokeWidth="2.5" />

          {/* Vèrtexs */}
          {currentPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#C8102E" stroke="#FFFDF9" strokeWidth="1.5" />
          ))}

          {/* Etiquetes de dimensions */}
          {data.map((d, i) => {
            const angle = i * angleStep - Math.PI / 2
            const labelR = maxR + 18
            const lx = center + labelR * Math.cos(angle)
            const ly = center + labelR * Math.sin(angle)

            return (
              <text
                key={d.dimension}
                x={lx}
                y={ly}
                textAnchor={Math.abs(Math.cos(angle)) < 0.2 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end'}
                dominantBaseline="central"
                className="text-[10.5px] font-bold fill-ink"
              >
                {d.dimension} ({d.score.toFixed(1)})
              </text>
            )
          })}
        </svg>
      </div>

      {/* Llegenda */}
      <div className="flex gap-4 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#C8102E]/30 border border-[#C8102E]" />
          Dades filtrades
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dashed border-[#5C534E]" />
          Benchmark Damm
        </span>
      </div>
    </div>
  )
}
