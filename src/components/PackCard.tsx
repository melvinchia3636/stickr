import React from 'react'

import { TouchableOpacity, View } from 'react-native'

import { Image } from 'expo-image'

import { getStickerPath } from '@/services/stickerFileManager'
import type { StickerPack } from '@/types'
import { IconButton } from 'react-native-paper'
import { Icon, Text, useTheme } from 'react-native-paper'

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
      activeOpacity={0.7}
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
            source={traySource}
            style={{ width: 56, height: 56 }}
            contentFit="contain"
          />
        ) : (
          <Icon
            source="sticker-emoji"
            size={32}
            color={t.colors.onSurfaceVariant}
          />
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          variant="titleSmall"
          style={{ color: t.colors.onSurface }}
          numberOfLines={1}
        >
          {pack.name}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: t.colors.onSurfaceVariant, marginTop: 2 }}
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
