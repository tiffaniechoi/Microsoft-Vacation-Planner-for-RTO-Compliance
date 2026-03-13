import { DayStatus } from '../types'

/** Returns the next status in the click/drag cycle: inoffice → vacation → wfh → inoffice */
export function nextDayStatus(current: DayStatus): DayStatus {
  if (current === 'inoffice') return 'vacation'
  if (current === 'vacation') return 'wfh'
  return 'inoffice'
}
