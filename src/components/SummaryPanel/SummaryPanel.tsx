import { useAppStore } from '../../store/useAppStore'
import { OverallCompliance } from '../../types'
import { getISOWeekId } from '../../engine/dateUtils'

function complianceConfig(compliance: OverallCompliance) {
  switch (compliance) {
    case 'PASS':
      return { bg: '#EFF6EF', border: '#107C10', text: '#054B16', label: '✓ Microsoft RTO Compliant' }
    case 'FAIL':
      return { bg: '#FDE7E9', border: '#D13438', text: '#8E1A1D', label: '✗ Not RTO Compliant' }
    case 'INSUFFICIENT_DATA':
      return { bg: '#F3F2F1', border: '#8A8886', text: '#605E5C', label: '— Not enough data yet' }
  }
}

export function SummaryPanel() {
  const overallCompliance = useAppStore(s => s.overallCompliance)
  const windowResults = useAppStore(s => s.windowResults)
  const settings = useAppStore(s => s.settings)
  const weeks = useAppStore(s => s.weeks)

  const cfg = complianceConfig(overallCompliance)

  const todayWeekId = getISOWeekId(new Date())
  const fullWindows = windowResults.filter(
    r => r.windowEndWeekId >= todayWeekId && r.weeks12.length >= 12
  )
  // Show the worst window's avg so the user sees the problem area
  const worstWindow = fullWindows.reduce<typeof fullWindows[0] | null>((worst, r) =>
    !worst || r.beltAverage < worst.beltAverage ? r : worst, null)
  const beltAvg = worstWindow?.beltAverage ?? settings.expectedOnsiteDaysPerWeek
  const compliantWeeks = weeks.filter(w => w.isCompliantWeek).length
  const totalWeeks = weeks.length

  return (
    <div className="p-4 mb-4 border-l-4" style={{ backgroundColor: cfg.bg, borderColor: cfg.border, borderRadius: '4px', borderLeftWidth: '4px', borderTopWidth: '1px', borderRightWidth: '1px', borderBottomWidth: '1px', borderStyle: 'solid' }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: cfg.text }}>{cfg.label}</h2>
          {overallCompliance === 'FAIL' ? (
            <p className="text-sm mt-0.5" style={{ color: cfg.text, opacity: 0.8 }}>
              Too much vacation within the 12‑week window lowers your average to <strong>{beltAvg.toFixed(1)}</strong> days per week. Consider spacing your time off further apart.
            </p>
          ) : (
            <p className="text-sm mt-0.5" style={{ color: cfg.text, opacity: 0.8 }}>
              Your vacation plan looks good. Avg: <strong>{beltAvg.toFixed(2)}</strong> days/week.
            </p>
          )}
        </div>
        <div className="flex gap-6 text-sm">
          <div className="text-center">
            <div className="font-semibold text-lg text-gray-800">{beltAvg.toFixed(1)}</div>
            <div className="text-gray-500 text-xs">RTO Avg</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg text-gray-800">{compliantWeeks}/{totalWeeks}</div>
            <div className="text-gray-500 text-xs">Compliant Weeks</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg text-gray-800">{settings.expectedOnsiteDaysPerWeek}</div>
            <div className="text-gray-500 text-xs">Target Days/Week</div>
          </div>
        </div>
      </div>
    </div>
  )
}
