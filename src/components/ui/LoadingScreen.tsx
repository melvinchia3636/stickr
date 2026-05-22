import React from 'react'

import { ActivityIndicator, View } from 'react-native'

import { Text, useTheme } from 'react-native-paper'

export default function LoadingScreen({
  message = 'Loading...'
}: {
  message?: string
}) {
  const t = useTheme()

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={t.colors.primary} size="large" />
      <Text style={{ color: t.colors.onSurfaceVariant, marginTop: 12 }}>
        {message}
      </Text>
    </View>
  )
}
