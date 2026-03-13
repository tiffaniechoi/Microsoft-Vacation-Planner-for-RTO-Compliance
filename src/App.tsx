import { useEffect } from 'react'
import { useAppStore } from './store/useAppStore'
import { SummaryPanel } from './components/SummaryPanel/SummaryPanel'
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel'
import { CalendarGrid } from './components/Calendar/CalendarGrid'
import { DetailsDrawer } from './components/DetailsDrawer/DetailsDrawer'

export function App() {
  const initializeDays = useAppStore(s => s.initializeDays)

  useEffect(() => {
    // Always call to merge new rolling dates without overwriting vacation data
    initializeDays()
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5', fontFamily: '"Segoe UI Variable", "Segoe UI", -apple-system, sans-serif' }}>
      <header className="bg-white sticky top-0 z-30 px-6 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid #EDEBE9' }}>
        {/* Microsoft four-color logo */}
        <div className="grid grid-cols-2 gap-0.5 w-6 h-6 flex-shrink-0">
          <div style={{ backgroundColor: '#F25022' }} />
          <div style={{ backgroundColor: '#7FBA00' }} />
          <div style={{ backgroundColor: '#00A4EF' }} />
          <div style={{ backgroundColor: '#FFB900' }} />
        </div>
        <span className="font-semibold text-gray-800" style={{ fontSize: '15px', letterSpacing: '-0.01em' }}>Microsoft</span>
        <span className="text-gray-300 mx-1">|</span>
        <span className="text-gray-700" style={{ fontSize: '15px' }}>RTO Planner</span>
      </header>

      <main className="w-full px-6 py-5">
        <div className="bg-white border border-gray-200 px-4 py-3 mb-4 text-sm text-gray-600" style={{ borderRadius: '4px' }}>
          This is a personal tool to help Microsoft employees plan their vacation while staying compliant with Return‑to‑Office requirements.
          <span className="block mt-1 text-xs text-gray-400">
            <span className="font-medium">Disclaimer:</span> This tool is independently created and is not an official Microsoft tool or an official source of Microsoft RTO policy.
          </span>
        </div>
        <SummaryPanel />
        <SettingsPanel />
        <CalendarGrid />
      </main>

      <DetailsDrawer />
    </div>
  )
}
