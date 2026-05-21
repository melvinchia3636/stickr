import React, { useCallback, useState } from 'react'

import { ActivityIndicator, View } from 'react-native'

import { useFocusEffect } from 'expo-router'

import EmptyState from '@/components/EmptyState'
import { getAllPacks, getStickerCountForPack } from '@/database/packRepository'
import type { StickerPack } from '@/types'
import { useTheme } from 'react-native-paper'

import HomeFab from './components/HomeFab'
import HomeHeader from './components/HomeHeader'
import PackList from './components/PackList'

export default function HomeScreen() {
  const t = useTheme()
  const [packs, setPacks] = useState<StickerPack[]>([])
  const [stickerCounts, setStickerCounts] = useState<Record<string, number>>({})
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadPacks = useCallback(() => {
    const all = getAllPacks()
    setPacks(all)
    const c: Record<string, number> = {}
    for (const p of all) c[p.id] = getStickerCountForPack(p.id)
    setStickerCounts(c)
    setLoading(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadPacks()
    }, [loadPacks])
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadPacks()
    setRefreshing(false)
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <HomeHeader count={packs.length} />
      <HomeFab />
      {loading ? (
        <ActivityIndicator
          size="large"
          style={{ flex: 1 }}
          color={t.colors.primary}
        />
      ) : packs.length === 0 ? (
        <EmptyState
          message="No sticker packs yet"
          subtitle="Create your own pack or browse SigStick to get started"
        />
      ) : (
        <PackList
          packs={packs}
          stickerCounts={stickerCounts}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onDeleted={loadPacks}
        />
      )}
    </View>
  )
}
