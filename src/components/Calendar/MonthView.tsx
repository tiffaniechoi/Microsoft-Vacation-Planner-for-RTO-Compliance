import { parseISO, format, startOfMonth, endOfMonth, startOfWeek, addDays, addWeeks } from 'date-fns'
import { WeekRow } from './WeekRow'
import { getISOWeekId } from '../../engine/dateUtils'

interface MonthViewProps {
  month: string // YYYY-MM
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SUN_WEEK = { weekStartsOn: 0 as const }

export function MonthView({ month }: MonthViewProps) {
  const monthDate = parseISO(`${month}-01`)
  const firstDay = startOfMonth(monthDate)
  const lastDay = endOfMonth(monthDate)

  // Find the Sunday that starts the first calendar row
  const firstSunday = startOfWeek(firstDay, SUN_WEEK)

  const weeks: { weekId: string; dates: string[] }[] = []
  let current = firstSunday

  while (current <= lastDay) {
    const dates: string[] = []
    for (let i = 0; i < 7; i++) {
      dates.push(format(addDays(current, i), 'yyyy-MM-dd'))
    }
    // Use the Monday in this row (index 1) as the anchor for the ISO week ID
    const monday = addDays(current, 1)
    const weekId = getISOWeekId(monday)
    weeks.push({ weekId, dates })
    current = addWeeks(current, 1)
  }

  return (
    <div className="space-y-1">
      {/* Day headers */}
      <div className="flex items-center gap-1">
        <div className="grid grid-cols-7 gap-1 flex-1">
          {DAY_HEADERS.map(h => (
            <div key={h} className="text-center text-xs font-semibold text-gray-500 py-1">
              {h}
            </div>
          ))}
        </div>
        <div className="w-24 text-center text-xs font-semibold text-gray-500 py-1">RTO</div>
      </div>

      {/* Week rows */}
      {weeks.map(({ weekId, dates }) => (
        <WeekRow key={weekId} weekId={weekId} dates={dates} currentMonth={month} />
      ))}
    </div>
  )
}
