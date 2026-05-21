import React, { useEffect, useState } from 'react'

import { ScrollView } from 'react-native'

import { useRouter } from 'expo-router'

import { useAlertStore } from '@/components/AlertManager'
import { getSetting, setSetting } from '@/database/packRepository'
import {
  Button,
  HelperText,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper'

export default function SettingsScreen() {
  const t = useTheme()
  const router = useRouter()
  const { openAlert } = useAlertStore()
  const [hostUrl, setHostUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(function () {
    const savedUrl = getSetting('server_host_url', '')
    setHostUrl(savedUrl)
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

  function handleSave() {
    let trimmedUrl = hostUrl.trim()
    if (trimmedUrl) {
      trimmedUrl = trimmedUrl.replace(/\/+$/, '')
    }
    if (!validateUrl(trimmedUrl)) {
      setError('Please enter a valid URL (starting with http:// or https://)')
      return
    }

    setSetting('server_host_url', trimmedUrl)
    setError('')

    openAlert({
      title: 'Success',
      message: 'Server settings saved successfully!',
      icon: 'check-circle',
      iconColor: t.colors.primary,
      actions: [
        {
          text: 'OK',
          onPress: function () {
            router.back()
          }
        }
      ]
    })
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text
        variant="titleMedium"
        style={{ color: t.colors.onBackground, marginBottom: 8, fontSize: 18 }}
      >
        API Connection Settings
      </Text>
      <Text
        variant="bodyMedium"
        style={{ color: t.colors.onSurface, marginBottom: 24 }}
      >
        Configure a custom external Express.js server host URL for sticker
        downloads and conversions.
      </Text>

      <TextInput
        mode="outlined"
        label="Server Host URL"
        placeholder="e.g. http://192.168.1.100:3000"
        value={hostUrl}
        onChangeText={function (text) {
          setHostUrl(text)
          if (error) setError('')
        }}
        error={!!error}
        style={{ backgroundColor: t.colors.surface }}
      />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>

      <Text
        variant="bodyMedium"
        style={{
          color: t.colors.onSurfaceVariant,
          marginBottom: 32,
          fontSize: 14
        }}
      >
        Leave this field empty to use the default platform-aware development
        loopbacks or production build variables.
      </Text>

      <Button
        mode="contained"
        icon="content-save"
        onPress={handleSave}
        style={{ paddingVertical: 4 }}
      >
        Save Settings
      </Button>
    </ScrollView>
  )
}
