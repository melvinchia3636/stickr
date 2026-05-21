import React from 'react'

import { FlatList, RefreshControl } from 'react-native'

import type { StickerPack } from '@/types'
import { useTheme } from 'react-native-paper'

import PackListItem from './PackListItem'

export default function PackList({
  packs,
  stickerCounts,
  refreshing,
  onRefresh,
  onDeleted
}: {
  packs: StickerPack[]
  stickerCounts: Record<string, number>
  refreshing: boolean
  onRefresh: () => void
  onDeleted: () => void
}) {
  const t = useTheme()

  return (
    <FlatList
      data={packs}
      renderItem={({ item }: { item: StickerPack }) => (
        <PackListItem
          pack={item}
          stickerCount={stickerCounts[item.id] || 0}
          onDeleted={onDeleted}
        />
      )}
      keyExtractor={item => item.id}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={t.colors.primary}
        />
      }
    />
  )
}
