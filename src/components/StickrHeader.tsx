import React from 'react'

import { View } from 'react-native'

import { Icon, Text, useTheme } from 'react-native-paper'

export default function StickrHeader() {
  const t = useTheme()

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Icon source="sticker-emoji" size={24} color={t.colors.primary} />
      <Text variant="titleLarge" style={{ color: t.colors.onSurface }}>
        Stickr
      </Text>
    </View>
  )
}
