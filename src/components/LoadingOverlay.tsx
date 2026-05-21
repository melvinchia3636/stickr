import React from 'react'

import { ActivityIndicator, View } from 'react-native'

import { Surface, useTheme } from 'react-native-paper'

export default function LoadingOverlay({ visible }: { visible: boolean }) {
  const t = useTheme()
  if (!visible) return null

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50
      }}
    >
      <Surface style={{ borderRadius: 12, padding: 24, elevation: 6 }}>
        <ActivityIndicator size="large" color={t.colors.primary} />
      </Surface>
    </View>
  )
}
