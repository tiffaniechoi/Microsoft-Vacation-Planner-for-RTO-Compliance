import { parseISO, format } from 'date-fns'
import { DayRecord, WeekRecord } from '../types'
import { getISOWeekId, getMondayOfWeek, getFridayOfWeek } from './dateUtils'

export function buildWeeksFromDays(
  days: DayRecord[],
  expectedOnsiteDaysPerWeek: number
): WeekRecord[] {
  // Group days by ISO week
  const weekMap = new Map<string, DayRecord[]>()
  for (const day of days) {
    const weekId = getISOWeekId(parseISO(day.date))
    if (!weekMap.has(weekId)) weekMap.set(weekId, [])
    weekMap.get(weekId)!.push(day)
  }

  const weeks: WeekRecord[] = []
  for (const [weekId, weekDays] of weekMap) {
    const workdays = weekDays.filter(d => d.isWorkday)
    if (workdays.length === 0) continue // skip boundary weeks with no workdays
    const plannedOnsiteDays = workdays.filter(d => d.isPlannedOnsite).length
    // Count actual in-office days directly — holidays never count regardless of
    // any stale isPlannedOnsite flag that may be in persisted localStorage data.
    const effectiveOnsiteDays = workdays.filter(d => d.status === 'inoffice').length
    const isCompliantWeek = effectiveOnsiteDays >= expectedOnsiteDaysPerWeek

    // Get start/end dates of this week
    const sampleDate = parseISO(weekDays[0].date)
    const monday = getMondayOfWeek(sampleDate)
    const friday = getFridayOfWeek(sampleDate)

    weeks.push({
      weekId,
      startDate: format(monday, 'yyyy-MM-dd'),
      endDate: format(friday, 'yyyy-MM-dd'),
      workdays: workdays.length,
      plannedOnsiteDays,
      effectiveOnsiteDays,
      isCompliantWeek,
      isInBest8ForWindow: false, // will be set by computeBeltWindows
    })
  }

  // Sort by weekId chronologically
  weeks.sort((a, b) => a.weekId.localeCompare(b.weekId))
  return weeks
}
