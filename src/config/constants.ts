export const DEFAULT_EXPECTED_ONSITE_DAYS = 3
export const BELT_WINDOW_WEEKS = 12

// Default onsite day-of-week presets keyed by required days/week (1=Mon … 5=Fri)
export const DEFAULT_ONSITE_DAYS: Record<number, number[]> = {
  0: [],
  1: [3],             // Wed
  2: [3, 4],          // Wed, Thu
  3: [1, 2, 3],       // Mon, Tue, Wed
  4: [1, 2, 3, 4],    // Mon, Tue, Wed, Thu
  5: [1, 2, 3, 4, 5], // Mon–Fri
}
export const BELT_BEST_N = 8
export const LOOKBACK_WEEKS = 13
export const LOOKAHEAD_WEEKS = 52

// Microsoft US Holidays 2026 — date → holiday name
export const MICROSOFT_HOLIDAYS: Record<string, string> = {
  '2026-01-01': "New Year's Day",
  '2026-01-19': 'Martin Luther King Day',
  '2026-02-16': 'Presidents Day',
  '2026-05-25': 'Memorial Day',
  '2026-07-03': 'Independence Day',
  '2026-09-07': 'Labor Day',
  '2026-11-26': 'Thanksgiving Day',
  '2026-11-27': 'Day after Thanksgiving',
  '2026-12-24': 'Christmas Eve',
  '2026-12-25': 'Christmas Day',
}
