import { Link } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import { PointsCard, RewardsCatalog, RewardsNote } from '../../components/Rewards'

export default function Recompenses() {
  const { pending } = useApp()
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-5 md:pt-10 pb-8 grid gap-5 md:gap-8 lg:grid-cols-[340px_1fr] items-start">
      <aside className="flex flex-col gap-3.5 lg:sticky lg:top-[96px]">
        <header>
          <h1 className="serif text-[32px] md:text-[44px] leading-tight">Recompenses</h1>
          <p className="text-sm md:text-base text-ink-muted mt-1">Bescanvia els teus punts a la cafeteria de la planta.</p>
        </header>
        <PointsCard />
        {pending[0] && <Link to={`/e/${pending[0].id}`} className="btn-red !h-[52px]">Guanya més punts responent</Link>}
        <RewardsNote />
      </aside>
      <div className="flex flex-col gap-4">
        <RewardsCatalog />
      </div>
    </div>
  )
}
