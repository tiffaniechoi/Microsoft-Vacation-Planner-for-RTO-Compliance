import { useAppStore } from '../../store/useAppStore'

interface WeekChipProps {
  weekId: string
}

export function WeekChip({ weekId }: WeekChipProps) {
  const decoration = useAppStore(s => s.weekDecorations.get(weekId))
  const settings = useAppStore(s => s.settings)

  if (!decoration) return <div className="w-24" />

  return (
    <div
      className="w-24 flex flex-col items-center justify-center px-1 py-1 rounded text-xs font-semibold"
      style={{ backgroundColor: '#F3F2F1' }}
      title={`Effective onsite: ${decoration.effectiveOnsiteDays.toFixed(1)} / ${settings.expectedOnsiteDaysPerWeek}`}
    >
      <span className="text-xs font-semibold" style={{ color: decoration.chipColor }}>
        {decoration.chipLabel}
      </span>
      <span className="text-xs" style={{ color: decoration.chipColor, opacity: 0.7 }}>
        {decoration.effectiveOnsiteDays.toFixed(1)}/{settings.expectedOnsiteDaysPerWeek}
      </span>
    </div>
  )
}
