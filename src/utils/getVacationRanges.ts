import { DayRecord } from '../types'
import { MICROSOFT_HOLIDAYS } from '../config/constants'

export interface VacationRange {
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
}

// Returns a local YYYY-MM-DD string from a Date, without UTC conversion issues.
function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Returns true when every calendar day strictly between prev and current
// is a non-working day (weekend or Microsoft holiday).
function allGapDaysNonWorking(prev: string, current: string): boolean {
  // Use noon to avoid any DST / midnight-rollover issues.
  const cursor = new Date(prev + 'T12:00:00')
  cursor.setDate(cursor.getDate() + 1)
  while (true) {
    const dateStr = toDateStr(cursor)
    if (dateStr >= current) break
    const dow = cursor.getDay() // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6 && !(dateStr in MICROSOFT_HOLIDAYS)) {
      return false // a real workday exists in the gap
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return true
}

export function getVacationRanges(days: Record<string, DayRecord>): VacationRange[] {
  const vacationDates = Object.values(days)
    .filter(d => d.status === 'vacation' && d.isWorkday)
    .map(d => d.date)
    .sort()

  if (vacationDates.length === 0) return []

  const ranges: VacationRange[] = []
  let start = vacationDates[0]
  let prev = vacationDates[0]

  for (let i = 1; i < vacationDates.length; i++) {
    const current = vacationDates[i]
    if (allGapDaysNonWorking(prev, current)) {
      prev = current
    } else {
      ranges.push({ startDate: start, endDate: prev })
      start = current
      prev = current
    }
  }
  ranges.push({ startDate: start, endDate: prev })

  return ranges
}
