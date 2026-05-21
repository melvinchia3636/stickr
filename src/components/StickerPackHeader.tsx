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
          source={{ uri: imageUri }}
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
          {name}
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: t.colors.onSurfaceVariant, marginTop: 4 }}
        >
          {stickerCount} sticker{stickerCount !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  )
}
