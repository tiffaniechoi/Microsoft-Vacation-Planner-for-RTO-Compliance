export type DayStatus = 'inoffice' | 'wfh' | 'vacation' | 'holiday' | 'travel'

export interface DayRecord {
  date: string // YYYY-MM-DD
  isWorkday: boolean
  status: DayStatus
  isPlannedOnsite: boolean
  isVacation: boolean
}

export interface WeekRecord {
  weekId: string // YYYY-Www
  startDate: string
  endDate: string
  workdays: number
  plannedOnsiteDays: number
  effectiveOnsiteDays: number
  isCompliantWeek: boolean
  isInBest8ForWindow: boolean
}

export interface BeltWindowResult {
  windowEndWeekId: string
  weeks12: WeekRecord[]
  best8: WeekRecord[]
  worst4: WeekRecord[]
  beltAverage: number
  compliance: 'PASS' | 'FAIL'
}

export interface DayDecoration {
  date: string
  bgColor: string
  label: string
}

export interface WeekDecoration {
  weekId: string
  chipColor: string
  chipLabel: string
  chipStatus: 'PASS' | 'FAIL' | null
  effectiveOnsiteDays: number
  isCompliantWeek: boolean
}

export interface AppSettings {
  expectedOnsiteDaysPerWeek: number
  onsiteDaysOfWeek: number[]
  rtoStartDate?: string // YYYY-MM-DD
}

export type OverallCompliance = 'PASS' | 'FAIL' | 'INSUFFICIENT_DATA'
