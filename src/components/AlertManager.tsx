import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react'

import {
  Button,
  Dialog,
  Icon,
  Portal,
  Text,
  useTheme
} from 'react-native-paper'

interface AlertAction {
  text: string
  onPress?: () => void
  style?: 'cancel' | 'destructive'
}

interface AlertConfig {
  title?: string
  message?: string
  icon?: string
  iconColor?: string
  actions?: AlertAction[]
}

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
    <AlertContext.Provider value={value}>
      {children}
      <AlertManager />
    </AlertContext.Provider>
  )
}

function AlertManager() {
  const { config, closeAlert } = useAlertStore()
  const t = useTheme()

  if (!config) return null

  return (
    <Portal>
      <Dialog
        visible={!!config}
        theme={{
          roundness: 5
        }}
        onDismiss={closeAlert}
      >
        {config.icon && (
          <Dialog.Content style={{ alignItems: 'center', paddingBottom: 0 }}>
            <Icon
              source={config.icon}
              size={40}
              color={config.iconColor || t.colors.primary}
            />
          </Dialog.Content>
        )}
        {config.title && (
          <Dialog.Title style={{ textAlign: 'center' }}>
            {config.title}
          </Dialog.Title>
        )}
        {config.message && (
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
              {config.message}
            </Text>
          </Dialog.Content>
        )}
        <Dialog.Actions style={{ justifyContent: 'center' }}>
          {config.actions?.map((action, i) => (
            <Button
              key={i}
              onPress={() => {
                action.onPress?.()
                closeAlert()
              }}
              textColor={
                action.style === 'destructive' ? t.colors.error : undefined
              }
            >
              {action.text}
            </Button>
          ))}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}
