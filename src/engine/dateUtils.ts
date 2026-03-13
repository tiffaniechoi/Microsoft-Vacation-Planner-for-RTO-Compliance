import {
  format,
  parseISO,
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  startOfWeek,
  endOfWeek,
  addDays,
  subWeeks,
  addWeeks,
  isWeekend,
} from 'date-fns'
import { LOOKBACK_WEEKS, LOOKAHEAD_WEEKS } from '../config/constants'

export function getISOWeekId(date: Date): string {
  const week = getISOWeek(date)
  const year = getISOWeekYear(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function getMondayOfWeek(date: Date): Date {
  return startOfISOWeek(date)
}

export function getFridayOfWeek(date: Date): Date {
  return addDays(startOfISOWeek(date), 4)
}

export function generateDateRange(start: string, end: string): string[] {
  const dates: string[] = []
  let current = parseISO(start)
  const endDate = parseISO(end)
  while (current <= endDate) {
    dates.push(format(current, 'yyyy-MM-dd'))
    current = addDays(current, 1)
  }
  return dates
}

export function isWeekday(date: Date): boolean {
  return !isWeekend(date)
}

export function parseDate(str: string): Date {
  return parseISO(str)
}

export function formatWeekRange(startDate: string, endDate: string): string {
  return `${format(parseISO(startDate), 'MMM d')} – ${format(parseISO(endDate), 'MMM d, yyyy')}`
}

const SUN_WEEK = { weekStartsOn: 0 as const }

export function getRollingDateRange(rtoStartDate?: string): { start: string; end: string } {
  const today = new Date()
  const start = rtoStartDate
    ? startOfWeek(parseISO(rtoStartDate), SUN_WEEK)
    : startOfWeek(subWeeks(today, LOOKBACK_WEEKS), SUN_WEEK)
  const end = endOfWeek(addWeeks(today, LOOKAHEAD_WEEKS), SUN_WEEK)
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  }
}
