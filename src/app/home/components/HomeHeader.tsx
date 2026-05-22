import React from 'react'

import { View } from 'react-native'

import { Text, useTheme } from 'react-native-paper'

export default function HomeHeader({ count }: { count: number }) {
  const t = useTheme()

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'baseline'
      }}
    >
      <Text style={{ color: t.colors.onSurface }} variant="titleLarge">
        Stickers Library
      </Text>
      {count > 0 && (
        <Text
          style={{ color: t.colors.onSurfaceVariant, marginLeft: 8 }}
          variant="bodySmall"
        >
          ({count})
        </Text>
      )}
    </View>
  )
}
