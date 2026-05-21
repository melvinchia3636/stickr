import React from 'react'

import { StatusBar, useColorScheme } from 'react-native'

import { Stack } from 'expo-router'

import AlertProvider from '@/components/AlertManager'
import StickrHeader from '@/components/StickrHeader'
import { darkTheme } from '@/themes/dark'
import { lightTheme } from '@/themes/light'
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  useFonts
} from '@expo-google-fonts/dm-sans'
import { PaperProvider } from 'react-native-paper'

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

export default function Layout() {
  const isDark = useColorScheme() === 'dark'
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold
  })
  const theme = isDark ? darkTheme : lightTheme

  if (!fontsLoaded) return null

  return (
    <PaperProvider theme={theme}>
      <AlertProvider>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
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
      </AlertProvider>
    </PaperProvider>
  )
}
