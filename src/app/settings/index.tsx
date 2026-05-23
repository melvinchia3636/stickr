/* eslint-disable padding-line-between-statements */
import React, { useEffect, useState } from 'react'

import { ScrollView, View } from 'react-native'

import { useRouter } from 'expo-router'

import { useAlertStore } from '@/components/ui/AlertManager'
import { getSetting, setSetting } from '@/database/repositories'
import { useThemeMode } from '@/themes/ThemeProvider'
import {
  Button,
  HelperText,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper'

export default function SettingsScreen() {
  const t = useTheme()

  const router = useRouter()

  const { openAlert } = useAlertStore()

  const { mode: themeMode, setMode } = useThemeMode()

  const [hostUrl, setHostUrl] = useState('')

  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      const savedUrl = await getSetting('server_host_url', '')

      setHostUrl(savedUrl)
    })()
  }, [])

  function validateUrl(url: string): boolean {
    if (!url) return true

    try {
      const parsed = new URL(url)

      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  async function handleSave() {
    let trimmedUrl = hostUrl.trim()

    if (trimmedUrl) {
      trimmedUrl = trimmedUrl.replace(/\/+$/, '')
    }

    if (!validateUrl(trimmedUrl)) {
      setError('Please enter a valid URL (starting with http:// or https://)')

      return
    }

    await setSetting('server_host_url', trimmedUrl)
    setError('')

    openAlert({
      title: 'Success',
      message: 'Server settings saved successfully!',
      icon: 'check-circle',
      iconColor: t.colors.primary,
      actions: [
        {
          text: 'OK',
          onPress: () => {
            router.back()
          }
        }
      ]
    })
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16 }}
      style={{ flex: 1, backgroundColor: t.colors.background }}
    >
      <Text
        style={{ color: t.colors.onBackground, marginBottom: 8, fontSize: 18 }}
        variant="titleMedium"
      >
        Theme
      </Text>
      <Text
        style={{ color: t.colors.onSurface, marginBottom: 12 }}
        variant="bodyMedium"
      >
        Choose your preferred appearance.
      </Text>

      <SegmentedButtons
        buttons={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' }
        ]}
        style={{ marginBottom: 32 }}
        value={themeMode}
        onValueChange={value => {
          setMode(value as 'system' | 'light' | 'dark')
          setSetting('theme_mode', value)
        }}
      />

      <View
        style={{
          height: 1,
          backgroundColor: t.colors.outlineVariant,
          marginBottom: 24
        }}
      />

      <Text
        style={{ color: t.colors.onBackground, marginBottom: 8, fontSize: 18 }}
        variant="titleMedium"
      >
        API Connection Settings
      </Text>
      <Text
        style={{ color: t.colors.onSurface, marginBottom: 24 }}
        variant="bodyMedium"
      >
        Configure a custom external Express.js server host URL for sticker
        downloads and conversions.
      </Text>

      <TextInput
        error={!!error}
        label="Server Host URL"
        mode="outlined"
        placeholder="e.g. http://192.168.1.100:3000"
        style={{ backgroundColor: t.colors.surface }}
        value={hostUrl}
        onChangeText={text => {
          setHostUrl(text)
          if (error) setError('')
        }}
      />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>

      <Text
        style={{
          color: t.colors.onSurfaceVariant,
          marginBottom: 32,
          fontSize: 14
        }}
        variant="bodyMedium"
      >
        Leave this field empty to use the default platform-aware development
        loopbacks or production build variables.
      </Text>

      <Button
        icon="content-save"
        mode="contained"
        style={{ paddingVertical: 4 }}
        onPress={handleSave}
      >
        Save Settings
      </Button>
    </ScrollView>
  )
}
