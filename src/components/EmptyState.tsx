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
          source="sticker-emoji"
          size={64}
          color={t.colors.onSurfaceVariant}
        />
      </View>
      <Text
        variant="titleLarge"
        style={{ color: t.colors.onSurface, marginBottom: 8 }}
      >
        {message}
      </Text>
      {subtitle && (
        <Text
          variant="bodyMedium"
          style={{ color: t.colors.onSurfaceVariant, textAlign: 'center' }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  )
}
