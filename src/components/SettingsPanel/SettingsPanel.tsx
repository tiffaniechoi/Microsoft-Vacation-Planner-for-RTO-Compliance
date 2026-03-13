import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { DEFAULT_ONSITE_DAYS } from '../../config/constants'
import { VacationList } from './VacationList'

const DAY_OPTIONS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
]

export function SettingsPanel() {
  const settings = useAppStore(s => s.settings)
  const updateSettings = useAppStore(s => s.updateSettings)
  const setVacationRange = useAppStore(s => s.setVacationRange)
  const clearVacationRange = useAppStore(s => s.clearVacationRange)

  const [vacFrom, setVacFrom] = useState('')
  const [vacTo, setVacTo] = useState('')

  function handleMarkVacation() {
    if (!vacFrom || !vacTo) return
    const from = vacFrom <= vacTo ? vacFrom : vacTo
    const to = vacFrom <= vacTo ? vacTo : vacFrom
    setVacationRange(from, to)
  }

  function handleClearVacation() {
    if (!vacFrom || !vacTo) return
    const from = vacFrom <= vacTo ? vacFrom : vacTo
    const to = vacFrom <= vacTo ? vacTo : vacFrom
    clearVacationRange(from, to)
  }

  function handlePolicyChange(days: number) {
    updateSettings({
      expectedOnsiteDaysPerWeek: days,
      onsiteDaysOfWeek: DEFAULT_ONSITE_DAYS[days],
    })
  }

  function toggleOnsiteDay(dayValue: number) {
    const current = settings.onsiteDaysOfWeek
    const next = current.includes(dayValue)
      ? current.filter(d => d !== dayValue)
      : [...current, dayValue].sort((a, b) => a - b)
    updateSettings({ onsiteDaysOfWeek: next })
  }

  const btnBase = 'px-3 py-1.5 text-sm font-medium transition-colors'
  const btnPrimary = `${btnBase} text-white`
  const btnSecondary = `${btnBase} bg-white text-gray-700 border border-gray-400 hover:bg-gray-100`

  return (
    <div className="bg-white border border-gray-200 p-4 mb-4" style={{ borderRadius: '4px' }}>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Settings</h3>
      <div className="flex flex-wrap gap-8 items-start">

        {/* Policy buttons */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Expected Onsite Days/Week
          </label>
          <select
            value={settings.expectedOnsiteDaysPerWeek}
            onChange={e => handlePolicyChange(Number(e.target.value))}
            className="px-2 py-1.5 border border-gray-300 text-sm focus:outline-none mb-2"
            style={{ borderRadius: '2px' }}
          >
            {[0, 1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>{n} {n === 1 ? 'day' : 'days'}</option>
            ))}
          </select>
          {/* Day-of-week selectors */}
          <label className="block text-xs font-medium text-gray-600 mb-1 mt-4">Planned Onsite Days</label>
          <div className="flex gap-1">
            {DAY_OPTIONS.map(({ label, value }) => {
              const isSelected = settings.onsiteDaysOfWeek.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleOnsiteDay(value)}
                  className={btnBase}
                  style={{
                    borderRadius: '2px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: isSelected ? '#0078D4' : '#fff',
                    color: isSelected ? '#fff' : '#323130',
                    border: isSelected ? 'none' : '1px solid #8A8886',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* RTO Start Date */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">RTO Start Date</label>
          <input
            type="date"
            value={settings.rtoStartDate ?? ''}
            onChange={e => updateSettings({ rtoStartDate: e.target.value || undefined })}
            className="px-2 py-1.5 border border-gray-300 text-sm focus:outline-none"
            style={{ borderRadius: '2px' }}
          />
          <p className="text-xs text-gray-400 mt-1">The date your return-to-office requirement began.</p>
        </div>

        {/* Vacation range entry */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Vacation / Time Off</label>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={vacFrom}
              onChange={e => {
                setVacFrom(e.target.value)
                if (vacTo && e.target.value > vacTo) setVacTo(e.target.value)
              }}
              className="px-2 py-1.5 border border-gray-300 text-sm focus:outline-none"
              style={{ borderRadius: '2px' }}
            />
            <span className="text-xs text-gray-500">to</span>
            <input
              type="date"
              value={vacTo}
              min={vacFrom}
              onChange={e => setVacTo(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 text-sm focus:outline-none"
              style={{ borderRadius: '2px' }}
            />
            <button
              onClick={handleMarkVacation}
              disabled={!vacFrom || !vacTo}
              className={btnPrimary + ' disabled:opacity-40'}
              style={{ borderRadius: '2px', backgroundColor: '#0078D4' }}
            >
              Mark Vacation
            </button>
            <button
              onClick={handleClearVacation}
              disabled={!vacFrom || !vacTo}
              className={btnSecondary + ' disabled:opacity-40'}
              style={{ borderRadius: '2px' }}
            >
              Clear
            </button>
          </div>
          <VacationList />
        </div>
      </div>

    </div>
  )
}
