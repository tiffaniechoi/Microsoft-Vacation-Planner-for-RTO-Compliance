import { describe, it, expect } from 'vitest'
import { computeBeltWindows } from '../computeBeltWindows'
import { WeekRecord } from '../../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWeek(weekId: string, effectiveOnsiteDays: number): WeekRecord {
  return {
    weekId,
    startDate: '',
    endDate: '',
    workdays: 5,
    plannedOnsiteDays: effectiveOnsiteDays,
    effectiveOnsiteDays,
    isCompliantWeek: effectiveOnsiteDays >= 3,
    isInBest8ForWindow: false,
  }
}

/** Build a sequence of week IDs like ['2025-W01', '2025-W02', ...] */
function weekIds(count: number, startWeek = 1, startYear = 2025): string[] {
  const ids: string[] = []
  let week = startWeek
  let year = startYear
  for (let i = 0; i < count; i++) {
    ids.push(`${year}-W${String(week).padStart(2, '0')}`)
    week++
    if (week > 52) { week = 1; year++ }
  }
  return ids
}

const POLICY = 3 // expectedOnsiteDaysPerWeek

// ---------------------------------------------------------------------------
// 1. Normal case — 12 weeks of strong attendance
// ---------------------------------------------------------------------------

describe('normal 12-week window — all strong', () => {
  const ids = weekIds(12)
  const weeks = ids.map(id => makeWeek(id, 4))
  const results = computeBeltWindows(weeks, POLICY)
  const last = results[results.length - 1]

  it('produces one result per week', () => {
    expect(results).toHaveLength(12)
  })

  it('selects best 8 weeks', () => {
    expect(last.best8).toHaveLength(8)
  })

  it('excludes worst 4 weeks', () => {
    expect(last.worst4).toHaveLength(4)
  })

  it('computes correct average (4.0)', () => {
    expect(last.beltAverage).toBe(4)
  })

  it('marks compliance PASS', () => {
    expect(last.compliance).toBe('PASS')
  })
})

// ---------------------------------------------------------------------------
// 2. Vacation weeks (0 days) — should be excluded as worst weeks
// ---------------------------------------------------------------------------

describe('vacation / zero-badge weeks excluded from best 8', () => {
  // Weeks 1–4: 4 days; weeks 5–6: 0 days (DTO); weeks 7–12: 3 days
  const ids = weekIds(12)
  const days = [4, 4, 4, 4, 0, 0, 3, 3, 3, 3, 3, 3]
  const weeks = ids.map((id, i) => makeWeek(id, days[i]))
  const results = computeBeltWindows(weeks, POLICY)
  const last = results[results.length - 1]

  it('full 12-week window present', () => {
    expect(last.weeks12).toHaveLength(12)
  })

  it('zero-badge weeks are in worst4, not best8', () => {
    const best8Ids = new Set(last.best8.map(w => w.weekId))
    expect(best8Ids.has(ids[4])).toBe(false) // week 5 (0 days)
    expect(best8Ids.has(ids[5])).toBe(false) // week 6 (0 days)
  })

  it('best8 contains the 4-day and 3-day weeks only', () => {
    for (const w of last.best8) {
      expect(w.effectiveOnsiteDays).toBeGreaterThan(0)
    }
  })

  it('average = (4+4+4+4+3+3+3+3)/8 = 3.5', () => {
    expect(last.beltAverage).toBe(3.5)
  })

  it('marks compliance PASS (3.5 >= 3)', () => {
    expect(last.compliance).toBe('PASS')
  })
})

// ---------------------------------------------------------------------------
// 3. Exactly 8 weeks of data — all weeks become best8
// ---------------------------------------------------------------------------

describe('exactly 8 weeks of data', () => {
  const ids = weekIds(8)
  const weeks = ids.map(id => makeWeek(id, 3))
  const results = computeBeltWindows(weeks, POLICY)
  const last = results[results.length - 1]

  it('best8 equals all 8 available weeks', () => {
    expect(last.best8).toHaveLength(8)
    expect(last.worst4).toHaveLength(0)
  })

  it('average is 3.0', () => {
    expect(last.beltAverage).toBe(3)
  })

  it('PASS', () => {
    expect(last.compliance).toBe('PASS')
  })
})

// ---------------------------------------------------------------------------
// 4. Fewer than 8 weeks — uses all available weeks
// ---------------------------------------------------------------------------

describe('fewer than 8 weeks of data', () => {
  const ids = weekIds(5)
  const weeks = ids.map(id => makeWeek(id, 3))
  const results = computeBeltWindows(weeks, POLICY)
  const last = results[results.length - 1]

  it('best8 uses all 5 available weeks', () => {
    expect(last.best8).toHaveLength(5)
  })

  it('worst4 is empty', () => {
    expect(last.worst4).toHaveLength(0)
  })

  it('window has fewer than 12 weeks (not a full window)', () => {
    expect(last.weeks12.length).toBeLessThan(12)
  })
})

// ---------------------------------------------------------------------------
// 5. More than 12 weeks — rolling window behavior
// ---------------------------------------------------------------------------

describe('rolling window with 15 weeks of data', () => {
  // weeks 1–3: 1 day (low); weeks 4–15: 4 days (strong)
  const ids = weekIds(15)
  const days = [1, 1, 1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
  const weeks = ids.map((id, i) => makeWeek(id, days[i]))
  const results = computeBeltWindows(weeks, POLICY)

  it('produces one result per week (15 total)', () => {
    expect(results).toHaveLength(15)
  })

  it('window at week 12 includes the early low weeks', () => {
    const r = results[11] // window ending at week 12
    expect(r.weeks12).toHaveLength(12)
    expect(r.weeks12[0].effectiveOnsiteDays).toBe(1)
  })

  it('window at week 15 has rolled past all low weeks', () => {
    const r = results[14] // window ending at week 15: weeks 4–15
    const weekIdsInWindow = r.weeks12.map(w => w.weekId)
    // weeks 1–3 (low) should no longer be in the window
    expect(weekIdsInWindow).not.toContain(ids[0])
    expect(weekIdsInWindow).not.toContain(ids[1])
    expect(weekIdsInWindow).not.toContain(ids[2])
  })

  it('window at week 15: average is 4.0 (all strong weeks)', () => {
    expect(results[14].beltAverage).toBe(4)
    expect(results[14].compliance).toBe('PASS')
  })
})

// ---------------------------------------------------------------------------
// 6. All weeks below policy threshold — FAIL
// ---------------------------------------------------------------------------

describe('all weeks below threshold — FAIL', () => {
  const ids = weekIds(12)
  const weeks = ids.map(id => makeWeek(id, 1))
  const results = computeBeltWindows(weeks, POLICY)
  const last = results[results.length - 1]

  it('compliance is FAIL', () => {
    expect(last.compliance).toBe('FAIL')
  })

  it('average is 1.0', () => {
    expect(last.beltAverage).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// 7. Mixed distribution — best 8 are correctly picked by highest days
// ---------------------------------------------------------------------------

describe('mixed distribution — best 8 selection', () => {
  const ids = weekIds(12)
  // Specific days per week to make expected selection deterministic
  const days = [5, 5, 5, 5, 1, 1, 1, 1, 3, 3, 3, 3]
  const weeks = ids.map((id, i) => makeWeek(id, days[i]))
  const results = computeBeltWindows(weeks, POLICY)
  const last = results[results.length - 1]

  it('best 8 are the four 5-day weeks and four 3-day weeks', () => {
    const best8Days = last.best8.map(w => w.effectiveOnsiteDays).sort((a, b) => b - a)
    expect(best8Days).toEqual([5, 5, 5, 5, 3, 3, 3, 3])
  })

  it('worst 4 are the four 1-day weeks', () => {
    expect(last.worst4.every(w => w.effectiveOnsiteDays === 1)).toBe(true)
  })

  it('average = (5*4 + 3*4) / 8 = 4.0', () => {
    expect(last.beltAverage).toBe(4)
  })

  it('PASS', () => {
    expect(last.compliance).toBe('PASS')
  })
})

// ---------------------------------------------------------------------------
// 8. Policy scenario from spec: weeks 1–4 strong, 5–6 DTO, 7–12 moderate
// ---------------------------------------------------------------------------

describe('spec scenario: weeks 1–4 strong, 5–6 DTO, 7–12 moderate', () => {
  const ids = weekIds(12)
  const days = [4, 5, 4, 5, 0, 0, 3, 4, 3, 4, 3, 3]
  const weeks = ids.map((id, i) => makeWeek(id, days[i]))
  const results = computeBeltWindows(weeks, POLICY)
  const last = results[results.length - 1]

  it('DTO weeks (0 days) are excluded from best 8', () => {
    const best8Ids = new Set(last.best8.map(w => w.weekId))
    expect(best8Ids.has(ids[4])).toBe(false)
    expect(best8Ids.has(ids[5])).toBe(false)
  })

  it('best 8 drawn from weeks 1–4 and 7–12', () => {
    expect(last.best8).toHaveLength(8)
  })

  it('average = (4+5+4+5+3+4+3+4)/8 = 4.0', () => {
    expect(last.beltAverage).toBe(4)
  })

  it('PASS', () => {
    expect(last.compliance).toBe('PASS')
  })
})

// ---------------------------------------------------------------------------
// 9. Edge case: one week exactly at policy threshold
// ---------------------------------------------------------------------------

describe('exactly at policy threshold (3 days avg)', () => {
  const ids = weekIds(12)
  const weeks = ids.map(id => makeWeek(id, 3))
  const results = computeBeltWindows(weeks, POLICY)
  const last = results[results.length - 1]

  it('average equals policy threshold exactly', () => {
    expect(last.beltAverage).toBe(3)
  })

  it('PASS (>= threshold)', () => {
    expect(last.compliance).toBe('PASS')
  })
})

// ---------------------------------------------------------------------------
// 10. Edge case: average just below threshold — FAIL
// ---------------------------------------------------------------------------

describe('average just below threshold (2.875 < 3)', () => {
  const ids = weekIds(12)
  // 4 weeks at 3 days, 8 weeks at 2 days — best 8 will be 4x3 + 4x2 = 20/8 = 2.875...
  // Actually: best8 = top 8 sorted. 4 weeks of 3, 8 weeks of 2 → best8 = 4x3 + 4x2 = 2.875
  const days = [3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2]
  const weeks = ids.map((id, i) => makeWeek(id, days[i]))
  const results = computeBeltWindows(weeks, POLICY)
  const last = results[results.length - 1]

  it('average is 2.5 (4×3 + 4×2 / 8)', () => {
    expect(last.beltAverage).toBe(2.5)
  })

  it('FAIL (< 3)', () => {
    expect(last.compliance).toBe('FAIL')
  })
})

// ---------------------------------------------------------------------------
// 11. isInBest8ForWindow flag is set correctly on WeekRecord
// ---------------------------------------------------------------------------

describe('isInBest8ForWindow flag', () => {
  const ids = weekIds(12)
  const days = [4, 4, 4, 4, 0, 0, 3, 3, 3, 3, 3, 3]
  const weeks = ids.map((id, i) => makeWeek(id, days[i]))
  computeBeltWindows(weeks, POLICY)

  it('non-zero weeks are flagged as in best8', () => {
    // After running, the last window's best8 should have isInBest8ForWindow=true
    // weeks 4 and 5 (0 days) should be false; all others true
    expect(weeks[4].isInBest8ForWindow).toBe(false)
    expect(weeks[5].isInBest8ForWindow).toBe(false)
  })

  it('strong weeks are flagged as in best8', () => {
    // weeks[0..3] = 4-day weeks → always in best8
    expect(weeks[0].isInBest8ForWindow).toBe(true)
    // weeks[8..11] = most recent 3-day weeks → in best8 via recency tie-break
    expect(weeks[8].isInBest8ForWindow).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 12. Empty input — no crashes
// ---------------------------------------------------------------------------

describe('empty input', () => {
  it('returns empty results', () => {
    expect(computeBeltWindows([], POLICY)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// 13. Single week
// ---------------------------------------------------------------------------

describe('single week', () => {
  const weeks = [makeWeek('2025-W01', 4)]
  const results = computeBeltWindows(weeks, POLICY)

  it('one result', () => {
    expect(results).toHaveLength(1)
  })

  it('best8 has 1 entry', () => {
    expect(results[0].best8).toHaveLength(1)
  })

  it('average equals that week', () => {
    expect(results[0].beltAverage).toBe(4)
  })
})
