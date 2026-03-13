import { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { getVacationRanges } from '../../utils/getVacationRanges'

function formatDateRange(startDate: string, endDate: string): string {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  if (startDate === endDate) return fmt(startDate)
  // Same year: omit year on first
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  if (start.getFullYear() === end.getFullYear()) {
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${startStr} – ${fmt(endDate)}`
  }
  return `${fmt(startDate)} – ${fmt(endDate)}`
}

export function VacationList() {
  const days = useAppStore(s => s.days)
  const clearVacationRange = useAppStore(s => s.clearVacationRange)
  const clearAllVacations = useAppStore(s => s.clearAllVacations)
  const ranges = useMemo(() => getVacationRanges(days), [days])
  const totalDays = useMemo(
    () => Object.values(days).filter(d => d.status === 'vacation' && d.isWorkday).length,
    [days]
  )

  if (ranges.length === 0) {
    return (
      <p className="text-xs text-gray-400 mt-2">No vacations scheduled.</p>
    )
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-gray-600">
          Scheduled Vacations
          <span className="ml-2 font-normal text-gray-400">({totalDays} day{totalDays !== 1 ? 's' : ''} total)</span>
        </p>
        <button onClick={clearAllVacations} className="text-xs text-red-600 hover:text-red-800 underline">
          Clear All
        </button>
      </div>
      <ul className="flex flex-col gap-1">
        {ranges.map(({ startDate, endDate }) => (
          <li key={`${startDate}-${endDate}`} className="flex items-center justify-between gap-3 text-xs text-gray-700">
            <span>{formatDateRange(startDate, endDate)}</span>
            <button
              onClick={() => clearVacationRange(startDate, endDate)}
              className="text-xs text-red-600 hover:text-red-800 underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
