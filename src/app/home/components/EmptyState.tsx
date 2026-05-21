import React from 'react'

import { View } from 'react-native'

import { Icon, Text, useTheme } from 'react-native-paper'

export default function EmptyState() {
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
        No sticker packs yet
      </Text>
      <Text
        variant="bodyMedium"
        style={{ color: t.colors.onSurfaceVariant, textAlign: 'center' }}
      >
        Create your own pack or browse SigStick to get started
      </Text>
    </View>
  )
}
