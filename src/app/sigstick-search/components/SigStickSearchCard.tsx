import React from 'react'

import { TouchableOpacity, View } from 'react-native'

import { Image } from 'expo-image'
import { useRouter } from 'expo-router'

import type { SigStickSearchResult } from '@/types'
import { Icon, Text, useTheme } from 'react-native-paper'

export default function SigStickSearchCard({
  item
}: {
  item: SigStickSearchResult
}) {
  const t = useTheme()
  const router = useRouter()

  return (
    <TouchableOpacity
      style={{
        flex: 1,
        backgroundColor: t.colors.surface,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1
      }}
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: '/sigstick-result',
          params: { packId: item.id, packTitle: item.title }
        })
      }
    >
      {item.thumbnail ? (
        <Image
          source={{ uri: item.thumbnail }}
          style={{ width: '100%', aspectRatio: 1 }}
          contentFit="contain"
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
            source="sticker-emoji"
            size={40}
            color={t.colors.onSurfaceVariant}
          />
        </View>
      )}
      <Text
        variant="labelMedium"
        style={{ color: t.colors.onSurface, padding: 8 }}
        numberOfLines={2}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  )
}
