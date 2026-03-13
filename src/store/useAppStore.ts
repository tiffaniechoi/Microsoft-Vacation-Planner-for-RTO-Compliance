import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { DayRecord, WeekRecord, BeltWindowResult, DayDecoration, WeekDecoration, AppSettings, OverallCompliance } from '../types'
import { DEFAULT_EXPECTED_ONSITE_DAYS, DEFAULT_ONSITE_DAYS, MICROSOFT_HOLIDAYS } from '../config/constants'
import { generateDateRange, getRollingDateRange, getISOWeekId, isWeekday, parseDate } from '../engine/dateUtils'
import { nextDayStatus } from '../utils/dayStatus'
import { buildWeeksFromDays } from '../engine/buildWeeksFromDays'
import { computeBeltWindows } from '../engine/computeBeltWindows'
import { mapCalendarDecorations } from '../engine/mapCalendarDecorations'
import { BELT_WINDOW_WEEKS } from '../config/constants'

function deriveOverallCompliance(
  windowResults: BeltWindowResult[],
  currentWeekId: string
): OverallCompliance {
  const fullWindows = windowResults.filter(
    r => r.windowEndWeekId >= currentWeekId && r.weeks12.length >= BELT_WINDOW_WEEKS
  )
  if (fullWindows.length === 0) return 'INSUFFICIENT_DATA'
  if (fullWindows.some(r => r.compliance === 'FAIL')) return 'FAIL'
  return 'PASS'
}

interface AppState {
  settings: AppSettings
  days: Record<string, DayRecord>
  weeks: WeekRecord[]
  windowResults: BeltWindowResult[]
  dayDecorations: Map<string, DayDecoration>
  weekDecorations: Map<string, WeekDecoration>
  overallCompliance: OverallCompliance
  selectedWeekId: string | null
  drawerOpen: boolean
  viewingMonth: string // YYYY-MM

  initializeDays: () => void
  toggleDayStatus: (date: string) => void
  setDayStatus: (date: string, status: DayRecord['status']) => void
  setVacationRange: (startDate: string, endDate: string) => void
  clearVacationRange: (startDate: string, endDate: string) => void
  clearAllVacations: () => void
  updateSettings: (partial: Partial<AppSettings>) => void
  openDrawer: (weekId: string) => void
  closeDrawer: () => void
  setViewingMonth: (month: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      function recompute(days: Record<string, DayRecord>, settings: AppSettings) {
        const dayArray = Object.values(days)
        const weeks = buildWeeksFromDays(dayArray, settings.expectedOnsiteDaysPerWeek)
        const windowResults = computeBeltWindows(weeks, settings.expectedOnsiteDaysPerWeek)
        const currentWeekId = getISOWeekId(new Date())
        const { dayDecorations, weekDecorations } = mapCalendarDecorations(dayArray, weeks, windowResults)
        const overallCompliance = deriveOverallCompliance(windowResults, currentWeekId)
        return { weeks, windowResults, dayDecorations, weekDecorations, overallCompliance }
      }

      function makeDayRecord(dateStr: string, onsiteDaysOfWeek: number[]): DayRecord {
        const date = parseDate(dateStr)
        const workday = isWeekday(date)
        const isHoliday = dateStr in MICROSOFT_HOLIDAYS
        const dayOfWeek = date.getDay() // 0=Sun,1=Mon,...,5=Fri,6=Sat
        const isOnsite = workday && onsiteDaysOfWeek.includes(dayOfWeek)
        return {
          date: dateStr,
          isWorkday: workday,
          status: isHoliday ? 'holiday' : isOnsite ? 'inoffice' : 'wfh',
          isPlannedOnsite: workday && !isHoliday && isOnsite,
          isVacation: isHoliday,
        }
      }

      function applyPattern(days: Record<string, DayRecord>, onsiteDaysOfWeek: number[]): Record<string, DayRecord> {
        const newDays: Record<string, DayRecord> = {}
        for (const [dateStr, day] of Object.entries(days)) {
          if (day.status === 'vacation') {
            newDays[dateStr] = day // preserve user vacation
            continue
          }
          if (!day.isWorkday) {
            newDays[dateStr] = day // preserve weekends
            continue
          }
          const dayOfWeek = parseDate(dateStr).getDay()
          const isOnsite = onsiteDaysOfWeek.includes(dayOfWeek)
          newDays[dateStr] = {
            ...day,
            status: day.status === 'holiday' ? 'holiday' : isOnsite ? 'inoffice' : 'wfh',
            isPlannedOnsite: isOnsite,
          }
        }
        return newDays
      }

      const defaultSettings: AppSettings = {
        expectedOnsiteDaysPerWeek: DEFAULT_EXPECTED_ONSITE_DAYS,
        onsiteDaysOfWeek: DEFAULT_ONSITE_DAYS[DEFAULT_EXPECTED_ONSITE_DAYS],
      }

      return {
        settings: defaultSettings,
        days: {},
        weeks: [],
        windowResults: [],
        dayDecorations: new Map(),
        weekDecorations: new Map(),
        overallCompliance: 'INSUFFICIENT_DATA',
        selectedWeekId: null,
        drawerOpen: false,
        viewingMonth: format(new Date(), 'yyyy-MM'),

        initializeDays: () => {
          const { days: existingDays, settings } = get()
          const { start, end } = getRollingDateRange(settings.rtoStartDate)
          const dates = generateDateRange(start, end)
          const newDays: Record<string, DayRecord> = {}
          for (const dateStr of dates) {
            const existing = existingDays[dateStr]
            // Only preserve user-set vacations; always recompute holidays from the
            // current MICROSOFT_HOLIDAYS list so stale holiday data is cleared.
            if (existing && existing.status === 'vacation') {
              newDays[dateStr] = existing
            } else {
              newDays[dateStr] = makeDayRecord(dateStr, settings.onsiteDaysOfWeek)
            }
          }
          const derived = recompute(newDays, settings)
          set({ days: newDays, ...derived })
        },

        toggleDayStatus: (date: string) => {
          const { days, settings } = get()
          const day = days[date]
          if (!day || !day.isWorkday) return
          if (day.status === 'holiday') return

          const next = nextDayStatus(day.status)
          const newDay: DayRecord = {
            ...day,
            status: next,
            isPlannedOnsite: next === 'inoffice',
            isVacation: next === 'vacation',
          }

          const newDays = { ...days, [date]: newDay }
          const derived = recompute(newDays, settings)
          set({ days: newDays, ...derived })
        },

        setDayStatus: (date: string, status: DayRecord['status']) => {
          const { days, settings } = get()
          const day = days[date]
          if (!day) return
          const dayOfWeek = parseDate(date).getDay()
          const isOnsite = settings.onsiteDaysOfWeek.includes(dayOfWeek)
          const newDay: DayRecord = {
            ...day,
            status,
            isPlannedOnsite: status === 'inoffice',
            isVacation: status === 'vacation' || status === 'holiday',
          }
          const newDays = { ...days, [date]: newDay }
          const derived = recompute(newDays, settings)
          set({ days: newDays, ...derived })
        },

        setVacationRange: (startDate: string, endDate: string) => {
          const { days, settings } = get()
          const dates = generateDateRange(startDate, endDate)
          const newDays = { ...days }
          for (const dateStr of dates) {
            const day = newDays[dateStr]
            if (!day || day.status === 'holiday') continue
            const date = parseDate(dateStr)
            if (!isWeekday(date)) continue
            newDays[dateStr] = { ...day, status: 'vacation', isPlannedOnsite: false, isVacation: true }
          }
          const derived = recompute(newDays, settings)
          set({ days: newDays, ...derived })
        },

        clearVacationRange: (startDate: string, endDate: string) => {
          const { days, settings } = get()
          const dates = generateDateRange(startDate, endDate)
          const newDays = { ...days }
          for (const dateStr of dates) {
            const day = newDays[dateStr]
            if (!day || day.status === 'holiday') continue
            const date = parseDate(dateStr)
            if (!isWeekday(date)) continue
            const dayOfWeek = date.getDay()
            const isOnsite = settings.onsiteDaysOfWeek.includes(dayOfWeek)
            newDays[dateStr] = { ...day, status: 'inoffice', isPlannedOnsite: isOnsite, isVacation: false }
          }
          const derived = recompute(newDays, settings)
          set({ days: newDays, ...derived })
        },

        clearAllVacations: () => {
          const { days, settings } = get()
          const newDays: Record<string, DayRecord> = {}
          for (const [dateStr, day] of Object.entries(days)) {
            if (day.status === 'vacation') {
              const dayOfWeek = parseDate(dateStr).getDay()
              const isOnsite = settings.onsiteDaysOfWeek.includes(dayOfWeek)
              newDays[dateStr] = { ...day, status: isOnsite ? 'inoffice' : 'wfh', isPlannedOnsite: isOnsite, isVacation: false }
            } else {
              newDays[dateStr] = day
            }
          }
          const derived = recompute(newDays, settings)
          set({ days: newDays, ...derived })
        },

        updateSettings: (partial: Partial<AppSettings>) => {
          const { settings } = get()
          const newSettings = { ...settings, ...partial }
          set({ settings: newSettings })
          if ('rtoStartDate' in partial) {
            get().initializeDays()
          } else if (partial.onsiteDaysOfWeek !== undefined) {
            const newDays = applyPattern(get().days, newSettings.onsiteDaysOfWeek)
            set({ days: newDays })
            const derived = recompute(newDays, newSettings)
            set({ ...derived })
          } else {
            const { days } = get()
            const derived = recompute(days, newSettings)
            set({ ...derived })
          }
        },

        openDrawer: (weekId: string) => {
          set({ drawerOpen: true, selectedWeekId: weekId })
        },

        closeDrawer: () => {
          set({ drawerOpen: false, selectedWeekId: null })
        },

        setViewingMonth: (month: string) => {
          set({ viewingMonth: month })
        },
      }
    },
    {
      name: 'rto-planner-storage',
      version: 5, // Increment to clear stale localStorage from previous schema
      partialize: (state) => ({
        settings: state.settings,
        days: state.days,
        viewingMonth: state.viewingMonth,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const currentWeekId = getISOWeekId(new Date())
          const derived = (() => {
            const dayArray = Object.values(state.days)
            const weeks = buildWeeksFromDays(dayArray, state.settings.expectedOnsiteDaysPerWeek)
            const windowResults = computeBeltWindows(weeks, state.settings.expectedOnsiteDaysPerWeek)
            const { dayDecorations, weekDecorations } = mapCalendarDecorations(dayArray, weeks, windowResults)
            const overallCompliance = deriveOverallCompliance(windowResults, currentWeekId)
            return { weeks, windowResults, dayDecorations, weekDecorations, overallCompliance }
          })()
          Object.assign(state, derived)
        }
      },
    }
  )
)
