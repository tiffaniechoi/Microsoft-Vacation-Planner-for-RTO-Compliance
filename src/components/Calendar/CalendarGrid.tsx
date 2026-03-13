import { useRef } from 'react'
import { format, parseISO, addMonths, subMonths, addYears, subYears } from 'date-fns'
import { MonthView } from './MonthView'
import { useAppStore } from '../../store/useAppStore'
import { DragSelectProvider } from './DragSelectContext'

export function CalendarGrid() {
  const viewingMonth = useAppStore(s => s.viewingMonth)
  const setViewingMonth = useAppStore(s => s.setViewingMonth)
  const monthInputRef = useRef<HTMLInputElement>(null)

  const monthDate = parseISO(`${viewingMonth}-01`)
  const monthLabel = format(monthDate, 'MMMM yyyy')

  function prevMonth() { setViewingMonth(format(subMonths(monthDate, 1), 'yyyy-MM')) }
  function nextMonth() { setViewingMonth(format(addMonths(monthDate, 1), 'yyyy-MM')) }
  function prevYear()  { setViewingMonth(format(subYears(monthDate, 1), 'yyyy-MM')) }
  function nextYear()  { setViewingMonth(format(addYears(monthDate, 1), 'yyyy-MM')) }

  const navBtn = 'px-2 py-1 rounded hover:bg-gray-100 transition-colors text-gray-600 font-bold text-sm'

  return (
    <DragSelectProvider>
      <div className="bg-white p-4" style={{ border: '1px solid #E0E0E0', borderRadius: '4px' }}>
        {/* Legend */}
        <div className="flex gap-4 mb-1 flex-wrap">
          {([
            { color: '#E5E7EB', label: 'WFH / Default', border: '1px solid #D1D5DB' },
            { color: '#0078D4', label: 'In-Office' },
            { color: '#D13438', label: 'Vacation / Holiday' },
          ] as { color: string; label: string; border?: string }[]).map(({ color, label, border }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5" style={{ backgroundColor: color, borderRadius: '2px', border: border ?? 'none' }} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mb-3">Click a day to cycle: In-Office → Vacation → WFH → In-Office.</p>
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <button onClick={prevYear}  className={navBtn} aria-label="Previous year">«</button>
            <button onClick={prevMonth} className={navBtn} aria-label="Previous month">‹</button>
          </div>

          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">{monthLabel}</h2>
            <div className="relative">
              <button
                onClick={() => monthInputRef.current?.showPicker()}
                className="flex items-center justify-center hover:text-gray-700 transition-colors text-gray-400"
                aria-label="Pick month and year"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </button>
              <input
                ref={monthInputRef}
                type="month"
                value={viewingMonth}
                onChange={e => { if (e.target.value) setViewingMonth(e.target.value) }}
                className="absolute opacity-0 pointer-events-none"
                style={{ width: 0, height: 0 }}
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={nextMonth} className={navBtn} aria-label="Next month">›</button>
            <button onClick={nextYear}  className={navBtn} aria-label="Next year">»</button>
          </div>
        </div>

        <MonthView month={viewingMonth} />
      </div>
    </DragSelectProvider>
  )
}
