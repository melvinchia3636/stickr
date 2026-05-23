import React, { useCallback, useState } from 'react'

import { ActivityIndicator, FlatList, RefreshControl } from 'react-native'

import { useFocusEffect } from 'expo-router'

import EmptyState from '@/components/ui/EmptyState'
import { getAllPacks, getStickerCountForPack } from '@/database/repositories'
import { isStickerPackWhitelisted } from '@/services/whatsappBridge'
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

  const [whatsappStatuses, setWhatsappStatuses] = useState<
    Record<string, boolean[]>
  >({})

  const [animatedPacks, setAnimatedPacks] = useState<Record<string, boolean>>({})

  const [refreshing, setRefreshing] = useState(false)

  const [loading, setLoading] = useState(true)

  const loadPacks = useCallback(async () => {
    const all = await getAllPacks()

    setPacks(all)

    const c: Record<string, number> = {}

    const ws: Record<string, boolean[]> = {}

    const ap: Record<string, boolean> = {}

    for (const p of all) {
      const count = await getStickerCountForPack(p.id)

      c[p.id] = count

      ap[p.id] = p.isAnimated

      if (count <= 30) {
        const wl = await isStickerPackWhitelisted(p.identifier)

        ws[p.id] = wl ? [true] : [false]
      } else {
        const partCount = Math.ceil(count / 30)

        const results: boolean[] = []

        for (let i = 0; i < partCount; i++) {
          const subId = `${p.identifier}_part${i + 1}`

          const isWl = await isStickerPackWhitelisted(subId)

          results.push(isWl)
        }
        ws[p.id] = results
      }
    }
    setStickerCounts(c)
    setWhatsappStatuses(ws)
    setAnimatedPacks(ap)
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
          isAnimated={animatedPacks[item.id] || false}
          pack={item}
          stickerCount={stickerCounts[item.id] || 0}
          whatsappStatus={whatsappStatuses[item.id]}
          onDeleted={loadPacks}
        />
      )}
    />
  )
}
