import React from 'react'

import { TouchableOpacity, View } from 'react-native'

import { Image } from 'expo-image'

import { getStickerPath } from '@/services/stickerFileManager'
import type { StickerPack } from '@/types'
import { Icon, IconButton, Text, useTheme } from 'react-native-paper'

export default function PackCard({
  pack,
  stickerCount,
  onPress,
  onMenuPress
}: {
  pack: StickerPack
  stickerCount: number
  onPress: () => void
  onMenuPress: (x: number, y: number) => void
}) {
  const t = useTheme()

  const traySource = pack.trayImageFile
    ? { uri: `file://${getStickerPath(pack.identifier, pack.trayImageFile)}` }
    : null

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
