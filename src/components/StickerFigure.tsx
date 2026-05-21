import React from 'react'

import { View } from 'react-native'

import { Image } from 'expo-image'

import { getStickerPath } from '@/services/stickerFileManager'
import type { Sticker } from '@/types'
import { useTheme } from 'react-native-paper'

export default function StickerFigure({
  sticker,
  identifier,
  size
}: {
  sticker: Sticker
  identifier: string
  size: number
}) {
  const t = useTheme()

  return (
    <View
      style={{
        width: size,
        height: size,
        marginBottom: 8,
        backgroundColor: t.colors.surface,
        borderRadius: 8,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1
      }}
    >
      <Image
        source={{
          uri: sticker.imageFileName.startsWith('http')
            ? sticker.imageFileName
            : `file://${getStickerPath(identifier, sticker.imageFileName)}`
        }}
        style={{ width: size - 10, height: size - 10 }}
        contentFit="contain"
      />
    </View>
  )
}
