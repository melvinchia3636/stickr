import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react'

import AlertPortal from '../components/AlertPortal'
import { AlertConfig } from '../types'

interface AlertState {
  config: AlertConfig | null
  openAlert: (config: AlertConfig) => void
  closeAlert: () => void
}

const AlertContext = createContext<AlertState | null>(null)

export function useAlertStore(): AlertState {
  const ctx = useContext(AlertContext)

  if (!ctx) throw new Error('AlertProvider missing')

  return ctx
}

export default function AlertProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AlertConfig | null>(null)

  const openAlert = useCallback((c: AlertConfig) => setConfig(c), [])

  const closeAlert = useCallback(() => setConfig(null), [])

  const value = useMemo(
    () => ({ config, openAlert, closeAlert }),
    [config, openAlert, closeAlert]
  )

  return (
    <AlertContext value={value}>
      {children}
      <AlertPortal />
    </AlertContext>
  )
}
