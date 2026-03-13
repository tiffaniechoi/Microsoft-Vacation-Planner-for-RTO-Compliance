import { DayRecord, WeekRecord, BeltWindowResult, DayDecoration, WeekDecoration } from '../types'
import { BELT_WINDOW_WEEKS, MICROSOFT_HOLIDAYS } from '../config/constants'

function getDayBgColor(status: string): string {
  if (status === 'inoffice') return '#0078D4'
  if (status === 'wfh') return '#F3F2F1'
  if (status === 'vacation') return '#D13438'
  if (status === 'holiday') return '#D13438'
  if (status === 'travel') return '#8764B8'
  return '#F3F2F1'
}

function getDayLabel(date: string, status: string): string {
  if (status === 'inoffice') return 'O'
  if (status === 'wfh') return 'WFH'
  if (status === 'vacation') return 'V'
  if (status === 'holiday') return MICROSOFT_HOLIDAYS[date] ?? 'Holiday'
  if (status === 'travel') return 'T'
  return ''
}

export function mapCalendarDecorations(
  days: DayRecord[],
  weeks: WeekRecord[],
  windowResults: BeltWindowResult[]
): { dayDecorations: Map<string, DayDecoration>; weekDecorations: Map<string, WeekDecoration> } {
  const dayDecorations = new Map<string, DayDecoration>()
  for (const day of days) {
    dayDecorations.set(day.date, {
      date: day.date,
      bgColor: getDayBgColor(day.status),
      label: getDayLabel(day.date, day.status),
    })
  }

  // Build week decorations from the latest window result for each week
  const weekDecorations = new Map<string, WeekDecoration>()

  // Build map of weekId -> latest window result containing it
  const weekWindowResult = new Map<string, BeltWindowResult>()
  for (const result of windowResults) {
    weekWindowResult.set(result.windowEndWeekId, result)
  }

  for (const week of weeks) {
    const result = weekWindowResult.get(week.weekId)
    let chipColor = '#6B7280'
    let chipLabel = '—'
    let chipStatus: 'PASS' | 'FAIL' | null = null

    // Only show compliance when there's a full 12-week window
    if (result && result.weeks12.length >= BELT_WINDOW_WEEKS) {
      chipStatus = result.compliance
      if (result.compliance === 'PASS') {
        chipColor = '#107C10'
        chipLabel = '✓ Strong'
      } else {
        chipColor = '#D13438'
        chipLabel = '✗ Weak'
      }
    }

    weekDecorations.set(week.weekId, {
      weekId: week.weekId,
      chipColor,
      chipLabel,
      chipStatus,
      effectiveOnsiteDays: week.effectiveOnsiteDays,
      isCompliantWeek: week.isCompliantWeek,
    })
  }

  return { dayDecorations, weekDecorations }
}
