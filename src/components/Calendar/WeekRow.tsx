import { DayCell } from './DayCell'
import { WeekChip } from './WeekChip'
import { useAppStore } from '../../store/useAppStore'

interface WeekRowProps {
  weekId: string
  dates: string[] // 7 dates Mon-Sun
  currentMonth: string // YYYY-MM
}

export function WeekRow({ weekId, dates, currentMonth }: WeekRowProps) {
  const openDrawer = useAppStore(s => s.openDrawer)

  function isCurrentMonth(date: string): boolean {
    return date.startsWith(currentMonth)
  }

  return (
    <div
      className="flex items-center gap-1 group cursor-pointer hover:bg-blue-50 rounded-lg p-1 transition-colors"
      onClick={() => openDrawer(weekId)}
      role="row"
    >
      <div className="grid grid-cols-7 gap-1 flex-1" role="presentation">
        {dates.map(date => (
          <div key={date} onClick={e => e.stopPropagation()} role="gridcell">
            <DayCell date={date} isCurrentMonth={isCurrentMonth(date)} />
          </div>
        ))}
      </div>
      <WeekChip weekId={weekId} />
    </div>
  )
}
