import React from 'react'

import { TouchableOpacity, View } from 'react-native'

import { Image } from 'expo-image'

import { getStickerPath } from '@/services/stickerFileManager'
import type { StickerPack } from '@/types'
import { Icon, IconButton, Text, useTheme } from 'react-native-paper'

export default function PackCard({
  pack,
  stickerCount,
  whatsappStatus,
  isAnimated,
  onPress,
  onMenuPress
}: {
  pack: StickerPack
  stickerCount: number
  whatsappStatus?: boolean[]
  isAnimated?: boolean
  onPress: () => void
  onMenuPress: (x: number, y: number) => void
}) {
  const t = useTheme()

  const traySource = pack.trayImageFile
    ? { uri: `file://${getStickerPath(pack.identifier, pack.trayImageFile)}` }
    : null

  let statusBadge = null

  if (whatsappStatus && whatsappStatus.length > 0) {
    const isFullyAdded = whatsappStatus.every(Boolean)

    const isPartiallyAdded = whatsappStatus.some(Boolean)

    const color = isFullyAdded
      ? '#10b981'
      : isPartiallyAdded
        ? '#f59e0b'
        : '#64748b'

    const icon = isFullyAdded
      ? 'check-circle'
      : isPartiallyAdded
        ? 'alert-circle-outline'
        : 'plus-circle-outline'

    const label = isFullyAdded
      ? 'Added'
      : isPartiallyAdded
        ? 'Partial'
        : 'Not Added'

    statusBadge = (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: `${color}15`,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 6,
          gap: 4
        }}
      >
        <Icon color={color} size={13} source={icon} />

        <Text
          style={{
            color,
            fontSize: 13,
            fontWeight: '600',
            lineHeight: 16
          }}
        >
          {label}
        </Text>
      </View>
    )
  }

  let animatedBadge = null

  if (isAnimated) {
    const animColor = '#8b5cf6'

    animatedBadge = (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: `${animColor}15`,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 6,
          gap: 4
        }}
      >
        <Icon color={animColor} size={13} source="motion-play" />

        <Text
          style={{
            color: animColor,
            fontSize: 13,
            fontWeight: '600',
            lineHeight: 16
          }}
        >
          Animated
        </Text>
      </View>
    )
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.colors.surface,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginVertical: 4,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1
      }}
      onPress={onPress}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: t.colors.surfaceVariant,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {traySource ? (
          <Image
            contentFit="contain"
            source={traySource}
            style={{ width: 56, height: 56 }}
          />
        ) : (
          <Icon
            color={t.colors.onSurfaceVariant}
            size={32}
            source="sticker-emoji"
          />
        )}
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        {(statusBadge || animatedBadge) && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 6,
              gap: 6
            }}
          >
            {statusBadge}
            {animatedBadge}
          </View>
        )}

        <Text
          numberOfLines={1}
          style={{ color: t.colors.onSurface }}
          variant="titleSmall"
        >
          {pack.name}
        </Text>

        <Text
          style={{ color: t.colors.onSurfaceVariant, marginTop: 2 }}
          variant="bodySmall"
        >
          {stickerCount} sticker{stickerCount !== 1 ? 's' : ''}
        </Text>
      </View>

      <IconButton
        icon="dots-vertical"
        size={20}
        onPress={e => {
          const { pageX, pageY } = e.nativeEvent

          onMenuPress(pageX, pageY)
        }}
      />
    </TouchableOpacity>
  )
}
