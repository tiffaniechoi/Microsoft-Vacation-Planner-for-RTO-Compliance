import { createContext, useContext, useRef, useEffect, ReactNode } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { DayRecord } from '../../types'
import { nextDayStatus } from '../../utils/dayStatus'

interface DragSelectContextValue {
  onDragMouseDown: (date: string) => void
  onDragMouseEnter: (date: string) => void
}

const DragSelectContext = createContext<DragSelectContextValue>({
  onDragMouseDown: () => {},
  onDragMouseEnter: () => {},
})

export function useDragSelect() {
  return useContext(DragSelectContext)
}

export function DragSelectProvider({ children }: { children: ReactNode }) {
  const setDayStatus = useAppStore(s => s.setDayStatus)
  const daysRef = useRef(useAppStore.getState().days)

  useEffect(() => {
    return useAppStore.subscribe(s => { daysRef.current = s.days })
  }, [])

  const isDragging = useRef(false)
  const dragStatus = useRef<DayRecord['status'] | null>(null)

  function onDragMouseDown(date: string) {
    const day = daysRef.current[date]
    if (!day || !day.isWorkday || day.status === 'holiday') return
    isDragging.current = true
    dragStatus.current = nextDayStatus(day.status)
    setDayStatus(date, dragStatus.current)
  }

  function onDragMouseEnter(date: string) {
    if (!isDragging.current || !dragStatus.current) return
    const day = daysRef.current[date]
    if (!day || !day.isWorkday || day.status === 'holiday') return
    setDayStatus(date, dragStatus.current)
  }

  useEffect(() => {
    function handleMouseUp() {
      isDragging.current = false
      dragStatus.current = null
    }
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [])

  return (
    <DragSelectContext.Provider value={{ onDragMouseDown, onDragMouseEnter }}>
      {children}
    </DragSelectContext.Provider>
  )
}
