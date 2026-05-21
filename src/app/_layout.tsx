import React from 'react'

import { StatusBar, View, useColorScheme } from 'react-native'

import { Stack } from 'expo-router'

import {
  Icon,
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
  Text
} from 'react-native-paper'

function createGreenTheme(base: typeof MD3LightTheme) {
  return {
    ...base,
    roundness: 8,
    colors: {
      ...base.colors,
      primary: '#558B2F',
      primaryContainer: '#F1F8E9',
      onPrimary: '#FFFFFF',
      onPrimaryContainer: '#33691E',
      secondary: '#689F38',
      secondaryContainer: '#DCEDC8',
      onSecondary: '#FFFFFF',
      onSecondaryContainer: '#33691E',
      tertiary: '#7CB342',
      tertiaryContainer: '#F1F8E9',
      onTertiary: '#FFFFFF',
      onTertiaryContainer: '#33691E',
      surface: '#FFFFFF',
      surfaceVariant: '#F5F5F5',
      background: '#F8F9FA',
      onSurface: '#1A1A1A',
      onSurfaceVariant: '#555',
      outline: '#E0E0E0',
      outlineVariant: '#E0E0E0',
      inversePrimary: '#AED581',
      elevation: {
        level0: 'transparent',
        level1: '#F5F5F5',
        level2: '#F0F0F0',
        level3: '#EEEEEE',
        level4: '#EBEBEB',
        level5: '#E8E8E8'
      }
    }
  }
}

function createGreenDarkTheme(base: typeof MD3DarkTheme) {
  return {
    ...base,
    roundness: 2,
    colors: {
      ...base.colors,
      primary: '#AED581',
      primaryContainer: '#33691E',
      onPrimary: '#1A1A1A',
      onPrimaryContainer: '#DCEDC8',
      secondary: '#9CCC65',
      secondaryContainer: '#558B2F',
      onSecondary: '#1A1A1A',
      onSecondaryContainer: '#DCEDC8',
      tertiary: '#AED581',
      tertiaryContainer: '#33691E',
      onTertiary: '#1A1A1A',
      onTertiaryContainer: '#DCEDC8',
      surface: '#1A1A1A',
      surfaceVariant: '#2A2A2A',
      background: '#121212',
      onSurface: '#E0E0E0',
      onSurfaceVariant: '#A0A0A0',
      outline: '#333333',
      outlineVariant: '#444444',
      inversePrimary: '#558B2F',
      elevation: {
        level0: 'transparent',
        level1: '#1E1E1E',
        level2: '#222222',
        level3: '#252525',
        level4: '#282828',
        level5: '#2A2A2A'
      }
    }
  }
}

export default function Layout() {
  const isDark = useColorScheme() === 'dark'
  const theme = isDark
    ? createGreenDarkTheme(MD3DarkTheme)
    : createGreenTheme(MD3LightTheme)

  return (
    <PaperProvider theme={theme}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.background }
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="home/index"
          options={{
            headerTitle: () => (
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Icon
                  source="sticker-emoji"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text
                  style={{
                    fontWeight: '700',
                    fontSize: 18,
                    color: theme.colors.onSurface
                  }}
                >
                  Stickr
                </Text>
              </View>
            )
          }}
        />
        <Stack.Screen
          name="create-pack/index"
          options={{ title: 'Create Pack', presentation: 'modal' }}
        />
        <Stack.Screen
          name="edit-pack/index"
          options={{ title: 'Edit Pack', presentation: 'modal' }}
        />
        <Stack.Screen
          name="sigstick-search/index"
          options={{ title: 'Browse SigStick', presentation: 'modal' }}
        />
        <Stack.Screen
          name="sigstick-result/index"
          options={{ title: 'Pack Details' }}
        />
        <Stack.Screen
          name="pack-detail/index"
          options={{ title: 'Pack Details' }}
        />
      </Stack>
    </PaperProvider>
  )
}
