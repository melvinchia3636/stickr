import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

import { StatusBar, useColorScheme } from 'react-native'

import { PaperProvider } from 'react-native-paper'

import { darkTheme } from './dark'
import { lightTheme } from './light'

export type ThemeMode = 'system' | 'light' | 'dark'

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeState | null>(null)

export function useThemeMode(): ThemeState {
  const ctx = useContext(ThemeContext)

  if (!ctx) throw new Error('ThemeProvider missing')

  return ctx
}

export default function ThemeProvider({
  children,
  savedMode
}: {
  children: ReactNode
  savedMode: ThemeMode
}) {
  const systemIsDark = useColorScheme() === 'dark'

  const [mode, setModeState] = useState<ThemeMode>(savedMode)

  useEffect(() => {
    setModeState(savedMode)
  }, [savedMode])

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m)
  }, [])

  const isDark = mode === 'system' ? systemIsDark : mode === 'dark'

  const theme = isDark ? darkTheme : lightTheme

  const value = useMemo(
    () => ({ mode, setMode, isDark }),
    [mode, setMode, isDark]
  )

  return (
    <ThemeContext value={value}>
      <PaperProvider theme={theme}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        {children}
      </PaperProvider>
    </ThemeContext>
  )
}
