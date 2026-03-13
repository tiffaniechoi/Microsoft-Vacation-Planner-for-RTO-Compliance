import React from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useDragSelect } from './DragSelectContext'
import { cn } from '../../utils/classNames'

interface DayCellProps {
  date: string // YYYY-MM-DD
  isCurrentMonth: boolean
}

export function DayCell({ date, isCurrentMonth }: DayCellProps) {
  const day = useAppStore(s => s.days[date])
  const decoration = useAppStore(s => s.dayDecorations.get(date))
  const toggleDayStatus = useAppStore(s => s.toggleDayStatus)
  const { onDragMouseDown, onDragMouseEnter } = useDragSelect()

  const dayNum = parseInt(date.split('-')[2], 10)
  const isWeekend = (() => {
    const d = new Date(date + 'T12:00:00')
    return d.getDay() === 0 || d.getDay() === 6
  })()

  const canClick = !isWeekend && day?.status !== 'holiday'

  function handleMouseDown(e: React.MouseEvent) {
    if (!canClick) return
    e.preventDefault() // prevent text selection during drag
    onDragMouseDown(date)
  }

  function handleMouseEnter() {
    if (!canClick) return
    onDragMouseEnter(date)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!canClick) return
      toggleDayStatus(date)
    }
  }

  const bgColor = isWeekend
    ? '#F9FAFB'
    : decoration?.bgColor ?? '#F3F2F1'

  const label = isWeekend ? '' : decoration?.label ?? ''

  const hasLightBg = isWeekend || !day || day?.status === 'wfh'

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center h-14 w-full text-xs font-medium select-none',
        !isCurrentMonth && 'opacity-30',
        canClick && 'cursor-pointer transition-shadow hover:shadow-md',
        !canClick && 'cursor-default',
      )}
      style={{
        backgroundColor: bgColor,
        borderRadius: '2px',
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onKeyDown={handleKeyDown}
      role={canClick ? 'button' : undefined}
      tabIndex={canClick ? 0 : undefined}
      aria-label={canClick ? `${date}: ${day?.status ?? 'unknown'}, click to toggle vacation` : date}
    >
      <span className={cn('text-xs font-semibold', hasLightBg ? 'text-gray-600' : 'text-white')}>
        {dayNum}
      </span>
      {label && (
        <span
          className={cn(
            'text-xs mt-0.5 text-center leading-tight px-0.5 w-full',
            hasLightBg ? 'text-gray-500' : 'text-white opacity-90',
          )}
          style={{ wordBreak: 'break-word' }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
