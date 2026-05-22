import React from 'react'

import { TouchableOpacity, View } from 'react-native'

import { Image } from 'expo-image'
import { useRouter } from 'expo-router'

import type { SigStickSearchResult } from '@/types'
import { Icon, Text, useTheme } from 'react-native-paper'

export default function SigStickSearchCard({
  item,
  isDownloaded
}: {
  item: SigStickSearchResult
  isDownloaded: boolean
}) {
  const t = useTheme()

  const router = useRouter()

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={{
        flex: 1,
        backgroundColor: t.colors.surface,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        position: 'relative',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1
      }}
      onPress={() => {
        router.push({
          pathname: '/sigstick-result',
          params: { packId: item.id, packTitle: item.title }
        })
      }}
    >
      {item.thumbnail ? (
        <Image
          contentFit="contain"
          source={{ uri: item.thumbnail }}
          style={{ width: '100%', aspectRatio: 1 }}
        />
      ) : (
        <View
          style={{
            width: '100%',
            aspectRatio: 1,
            backgroundColor: t.colors.surfaceVariant,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon
            color={t.colors.onSurfaceVariant}
            size={40}
            source="sticker-emoji"
          />
        </View>
      )}
      <Text
        numberOfLines={2}
        style={{ color: t.colors.onSurface, padding: 8 }}
        variant="bodyLarge"
      >
        {item.title}
      </Text>
      {isDownloaded && (
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: t.colors.primary,
            borderRadius: 12,
            width: 24,
            height: 24,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2
          }}
        >
          <Icon color={t.colors.onPrimary} size={16} source="check" />
        </View>
      )}
    </TouchableOpacity>
  )
}
