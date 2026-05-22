import React, { useCallback, useState } from 'react'

import { ActivityIndicator, FlatList, RefreshControl } from 'react-native'

import { useFocusEffect } from 'expo-router'

import EmptyState from '@/components/ui/EmptyState'
import { getAllPacks, getStickerCountForPack } from '@/database/repositories'
import type { StickerPack } from '@/types'
import { useTheme } from 'react-native-paper'

import PackListItem from './PackListItem'

export default function PackList({
  onCountChange
}: {
  onCountChange?: (count: number) => void
}) {
  const t = useTheme()

  const [packs, setPacks] = useState<StickerPack[]>([])

  const [stickerCounts, setStickerCounts] = useState<Record<string, number>>({})

  const [refreshing, setRefreshing] = useState(false)

  const [loading, setLoading] = useState(true)

  const loadPacks = useCallback(async () => {
    const all = await getAllPacks()

    setPacks(all)

    const c: Record<string, number> = {}

    for (const p of all) {
      c[p.id] = await getStickerCountForPack(p.id)
    }
    setStickerCounts(c)
    setLoading(false)
    onCountChange?.(all.length)
  }, [onCountChange])

  useFocusEffect(
    useCallback(() => {
      loadPacks()
    }, [loadPacks])
  )

  async function onRefresh() {
    setRefreshing(true)
    await loadPacks()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <ActivityIndicator
        color={t.colors.primary}
        size="large"
        style={{ flex: 1 }}
      />
    )
  }

  if (packs.length === 0) {
    return (
      <EmptyState
        message="No sticker packs yet"
        subtitle="Create your own pack or browse SigStick to get started"
      />
    )
  }

  return (
    <FlatList
      contentContainerStyle={{ paddingBottom: 20 }}
      data={packs}
      keyExtractor={item => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={t.colors.primary}
          onRefresh={onRefresh}
        />
      }
      renderItem={({ item }: { item: StickerPack }) => (
        <PackListItem
          pack={item}
          stickerCount={stickerCounts[item.id] || 0}
          onDeleted={loadPacks}
        />
      )}
    />
  )
}
