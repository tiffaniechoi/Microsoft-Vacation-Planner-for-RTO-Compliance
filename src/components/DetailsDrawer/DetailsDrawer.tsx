import { format, parseISO } from 'date-fns'
import { useAppStore } from '../../store/useAppStore'
import { cn } from '../../utils/classNames'

export function DetailsDrawer() {
  const drawerOpen = useAppStore(s => s.drawerOpen)
  const selectedWeekId = useAppStore(s => s.selectedWeekId)
  const closeDrawer = useAppStore(s => s.closeDrawer)
  const windowResults = useAppStore(s => s.windowResults)
  const weeks = useAppStore(s => s.weeks)
  const days = useAppStore(s => s.days)
  const settings = useAppStore(s => s.settings)

  const selectedWeek = weeks.find(w => w.weekId === selectedWeekId)

  // Find the window result for this week
  const windowResult = windowResults.find(r => r.windowEndWeekId === selectedWeekId)

  // Get days for selected week
  const weekDays = selectedWeek
    ? Object.values(days).filter(
        d => d.date >= selectedWeek.startDate && d.date <= selectedWeek.endDate && d.isWorkday
      ).sort((a, b) => a.date.localeCompare(b.date))
    : []

  const statusLabels: Record<string, string> = {
    inoffice: 'In-Office',
    wfh: 'WFH',
    vacation: 'Vacation',
    holiday: 'Holiday',
    travel: 'Travel',
  }
  const statusColors: Record<string, string> = {
    inoffice: 'bg-blue-100 text-blue-800',
    wfh: 'bg-gray-100 text-gray-700',
    vacation: 'bg-red-100 text-red-800',
    holiday: 'bg-red-100 text-red-800',
    travel: 'bg-purple-100 text-purple-800',
  }

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto transition-transform duration-300',
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Week Details</h2>
              {selectedWeek && (
                <p className="text-sm text-gray-500">
                  {format(parseISO(selectedWeek.startDate), 'MMM d')} –{' '}
                  {format(parseISO(selectedWeek.endDate), 'MMM d, yyyy')}
                </p>
              )}
            </div>
            <button
              onClick={closeDrawer}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 font-bold text-xl"
              aria-label="Close drawer"
            >
              ✕
            </button>
          </div>

          {selectedWeek && (
            <>
              {/* Week summary */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs">Planned Onsite</div>
                    <div className="font-semibold">{selectedWeek.plannedOnsiteDays} days</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Effective Onsite</div>
                    <div className="font-semibold">{selectedWeek.effectiveOnsiteDays.toFixed(2)} days</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Available Workdays</div>
                    <div className="font-semibold">{selectedWeek.workdays} days</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Target</div>
                    <div className="font-semibold">{settings.expectedOnsiteDaysPerWeek} days</div>
                  </div>
                </div>
              </div>

              {/* Day breakdown */}
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Day Breakdown</h3>
              <div className="space-y-1 mb-4">
                {weekDays.map(day => (
                  <div key={day.date} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-700">
                      {format(parseISO(day.date), 'EEEE, MMM d')}
                    </span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColors[day.status])}>
                      {statusLabels[day.status] ?? day.status}
                    </span>
                  </div>
                ))}
                {weekDays.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No workdays found for this week.</p>
                )}
              </div>

              {/* RTO window */}
              {windowResult && (
                <>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    RTO Window (trailing 12 weeks)
                  </h3>
                  {windowResult.weeks12.length < 12 ? (
                    <p className="text-xs text-gray-400 italic mb-3">
                      Not enough history — RTO score available after 12 weeks.
                    </p>
                  ) : (
                    <>
                      <div className={cn(
                        'rounded-lg p-3 mb-3 text-sm',
                        windowResult.compliance === 'PASS' && 'bg-green-50 border border-green-200',
                        windowResult.compliance === 'FAIL' && 'bg-red-50 border border-red-200',
                      )}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">
                            {windowResult.compliance === 'PASS' && '✅ PASS'}
                            {windowResult.compliance === 'FAIL' && '❌ FAIL'}
                          </span>
                          <span className="text-xs text-gray-600">
                            RTO Avg: <strong>{windowResult.beltAverage.toFixed(2)}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Best 8 weeks */}
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-600 mb-1.5">
                          Best 8 of {windowResult.weeks12.length} Weeks
                        </h4>
                        <div className="space-y-0.5">
                          {windowResult.best8.map((w, i) => (
                            <div
                              key={w.weekId}
                              className={cn(
                                'flex items-center justify-between py-1 px-2 rounded text-xs',
                                w.weekId === selectedWeekId ? 'bg-blue-100 font-semibold' : 'bg-gray-50'
                              )}
                            >
                              <span className="text-gray-600">
                                #{i + 1} {format(parseISO(w.startDate), 'MMM d')} – {format(parseISO(w.endDate), 'MMM d')}
                              </span>
                              <span className="font-medium">{w.effectiveOnsiteDays.toFixed(2)} days</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Excluded weeks */}
                      {windowResult.worst4.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 mb-1.5">
                            Excluded ({windowResult.worst4.length} weeks)
                          </h4>
                          <div className="space-y-0.5">
                            {windowResult.worst4.map(w => (
                              <div key={w.weekId} className="flex items-center justify-between py-1 px-2 rounded text-xs bg-gray-50 opacity-60">
                                <span className="text-gray-500">
                                  {format(parseISO(w.startDate), 'MMM d')} – {format(parseISO(w.endDate), 'MMM d')}
                                </span>
                                <span>{w.effectiveOnsiteDays.toFixed(2)} days</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}

          {!selectedWeek && (
            <p className="text-gray-400 text-sm italic mt-8 text-center">
              Click a week row to see details.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
