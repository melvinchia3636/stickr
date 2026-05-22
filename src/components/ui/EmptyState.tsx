import React from 'react'

import { View } from 'react-native'

import { Icon, Text, useTheme } from 'react-native-paper'

export default function EmptyState({
  message,
  subtitle
}: {
  message: string
  subtitle?: string
}) {
  const t = useTheme()

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32
      }}
    >
      <View style={{ marginBottom: 16 }}>
        <Icon
          color={t.colors.onSurfaceVariant}
          size={64}
          source="sticker-emoji"
        />
      </View>
      <Text
        style={{ color: t.colors.onSurface, marginBottom: 8 }}
        variant="titleLarge"
      >
        {message}
      </Text>
      {subtitle && (
        <Text
          style={{ color: t.colors.onSurfaceVariant, textAlign: 'center' }}
          variant="bodyMedium"
        >
          {subtitle}
        </Text>
      )}
    </View>
  )
}
