import { WeekRecord, BeltWindowResult } from '../types'
import { BELT_WINDOW_WEEKS, BELT_BEST_N } from '../config/constants'

function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function computeBeltWindows(
  weeks: WeekRecord[],
  expectedOnsiteDaysPerWeek: number
): BeltWindowResult[] {
  const results: BeltWindowResult[] = []

  for (let i = 0; i < weeks.length; i++) {
    const startIdx = Math.max(0, i - BELT_WINDOW_WEEKS + 1)
    const window12 = weeks.slice(startIdx, i + 1)

    const sorted = [...window12].sort((a, b) => {
      if (b.effectiveOnsiteDays !== a.effectiveOnsiteDays) {
        return b.effectiveOnsiteDays - a.effectiveOnsiteDays
      }
      return b.weekId.localeCompare(a.weekId)
    })

    const best8 = sorted.slice(0, Math.min(BELT_BEST_N, sorted.length))
    const worst4 = sorted.slice(Math.min(BELT_BEST_N, sorted.length))
    const beltAverage = mean(best8.map(w => w.effectiveOnsiteDays))
    const compliance: 'PASS' | 'FAIL' = beltAverage >= expectedOnsiteDaysPerWeek ? 'PASS' : 'FAIL'

    const best8Ids = new Set(best8.map(w => w.weekId))
    for (const week of window12) {
      week.isInBest8ForWindow = best8Ids.has(week.weekId)
    }

    results.push({
      windowEndWeekId: weeks[i].weekId,
      weeks12: window12,
      best8,
      worst4,
      beltAverage,
      compliance,
    })
  }

  return results
}
