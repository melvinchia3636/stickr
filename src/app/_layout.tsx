/* eslint-disable padding-line-between-statements */
import React, { useEffect, useState } from 'react'

import { Stack } from 'expo-router'

import StickrHeader from '@/components/StickrHeader'
import { AlertProvider } from '@/components/ui/AlertManager'
import { getSetting } from '@/database/repositories'
import ThemeProvider, { ThemeMode } from '@/themes/ThemeProvider'
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  useFonts
} from '@expo-google-fonts/dm-sans'
import { useTheme } from 'react-native-paper'

const SCREENS: {
  name: string
  title?: string
  headerTitle?: () => React.ReactElement
  headerShown?: boolean
  modal?: boolean
}[] = [
  { name: 'index', headerShown: false },
  { name: 'home/index', headerTitle: () => <StickrHeader /> },
  { name: 'create-pack/index', title: 'Create Pack', modal: true },
  { name: 'edit-pack/index', title: 'Edit Pack', modal: true },
  { name: 'sigstick-search/index', title: 'Browse SigStick', modal: true },
  { name: 'sigstick-result/index', title: 'Pack Details' },
  { name: 'pack-detail/index', title: 'Pack Details' },
  { name: 'settings/index', title: 'Settings' }
]

function AppContent() {
  const theme = useTheme()

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: { fontFamily: 'DMSans_500Medium' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background }
      }}
    >
      {SCREENS.map(s => (
        <Stack.Screen
          key={s.name}
          name={s.name}
          options={{
            title: s.title,
            headerTitle: s.headerTitle,
            headerShown: s.headerShown,
            presentation: s.modal ? ('modal' as const) : undefined
          }}
        />
      ))}
    </Stack>
  )
}

export default function Layout() {
  const [savedMode, setSavedMode] = useState<ThemeMode>('system')

  const [loaded, setLoaded] = useState(false)

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold
  })

  useEffect(() => {
    ;(async () => {
      const stored = await getSetting('theme_mode', 'system')

      setSavedMode(stored as ThemeMode)
      setLoaded(true)
    })()
  }, [])

  if (!fontsLoaded || !loaded) return null

  return (
    <ThemeProvider savedMode={savedMode}>
      <AlertProvider>
        <AppContent />
      </AlertProvider>
    </ThemeProvider>
  )
}
