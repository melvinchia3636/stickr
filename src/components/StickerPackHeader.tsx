import React from 'react'

import { View } from 'react-native'

import { Image } from 'expo-image'

import { Text, useTheme } from 'react-native-paper'

export default function StickerPackHeader({
  name,
  stickerCount,
  imageUri
}: {
  name: string
  stickerCount: number
  imageUri: string | null
}) {
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
      {imageUri && (
        <Image
          contentFit="contain"
          source={{ uri: imageUri }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            backgroundColor: t.colors.surface
          }}
        />
      )}
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontWeight: '700', color: t.colors.onSurface }}
          variant="titleLarge"
        >
          {name}
        </Text>
        <Text
          style={{ color: t.colors.onSurfaceVariant, marginTop: 4 }}
          variant="bodyMedium"
        >
          {stickerCount} sticker{stickerCount !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  )
}
