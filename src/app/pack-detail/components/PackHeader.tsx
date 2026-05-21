import React from 'react'

import { View } from 'react-native'

import { Image } from 'expo-image'

import { getStickerPath } from '@/services/stickerFileManager'
import type { PackWithStickers } from '@/types'
import { Text, useTheme } from 'react-native-paper'

export default function PackHeader({ pack }: { pack: PackWithStickers }) {
  const t = useTheme()

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        gap: 12
      }}
    >
      {pack.stickers.length > 0 && (
        <Image
          source={{
            uri: `file://${getStickerPath(pack.identifier, pack.stickers[0].imageFileName)}`
          }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            backgroundColor: t.colors.surface
          }}
          contentFit="contain"
        />
      )}
      <View style={{ flex: 1 }}>
        <Text
          variant="titleLarge"
          style={{ fontWeight: '700', color: t.colors.onSurface }}
        >
          {pack.name}
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: t.colors.onSurfaceVariant, marginTop: 4 }}
        >
          {pack.stickers.length} sticker
          {pack.stickers.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  )
}
