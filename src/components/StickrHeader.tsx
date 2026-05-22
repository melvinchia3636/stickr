import React from 'react'

import { View } from 'react-native'

import { Icon, Text, useTheme } from 'react-native-paper'

export default function StickrHeader() {
  const t = useTheme()

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Icon color={t.colors.primary} size={24} source="sticker-emoji" />
      <Text style={{ color: t.colors.onSurface }} variant="titleLarge">
        Stickr
      </Text>
    </View>
  )
}
