import React from 'react'

import { Animated, TouchableOpacity } from 'react-native'

import { Icon, Surface, Text, useTheme } from 'react-native-paper'
import type { IconSource } from 'react-native-paper/lib/typescript/components/Icon'

export default function FabItem({
  icon,
  label,
  index,
  anim,
  onPress
}: {
  icon: IconSource
  label: string
  index: number
  anim: Animated.Value
  onPress: () => void
}) {
  const t = useTheme()

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [(index + 1) * 20, 0]
            })
          },
          {
            scale: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1]
            })
          }
        ]
      }}
    >
      <Surface style={{ borderRadius: 999, marginBottom: 12, elevation: 4 }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 16,
            paddingRight: 20,
            height: 44
          }}
          onPress={onPress}
        >
          <Icon color={t.colors.primary} size={20} source={icon} />
          <Text
            style={{ marginLeft: 8, color: t.colors.onSurface }}
            variant="labelLarge"
          >
            {label}
          </Text>
        </TouchableOpacity>
      </Surface>
    </Animated.View>
  )
}
