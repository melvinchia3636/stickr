import React, { useEffect, useState } from 'react'

import { ActivityIndicator, ScrollView, Text, View } from 'react-native'

import { useLocalSearchParams, useNavigation } from 'expo-router'

import { getPackWithStickers } from '@/database/packRepository'
import type { PackWithStickers } from '@/types'
import { useTheme } from 'react-native-paper'

import PackHeader from './components/PackHeader'
import StickerList from './components/StickerList'
import WhatsAppSection from './components/WhatsAppSection'
import useHeaderMenu from './hooks/useHeaderMenu'

export default function PackDetailScreen() {
  const navigation = useNavigation()
  const { packId } = useLocalSearchParams<{ packId: string }>()
  const t = useTheme()

  const [pack, setPack] = useState<PackWithStickers | null>(null)
  const [menuVisible, setMenuVisible] = useState(false)

  useEffect(() => {
    ;(async () => {
      const p = await getPackWithStickers(packId)
      setPack(p)
    })()
  }, [])

  useHeaderMenu({ navigation, menuVisible, setMenuVisible, pack })

  if (!pack) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={t.colors.primary} />
        <Text style={{ color: t.colors.onSurfaceVariant, marginTop: 12 }}>
          Loading pack...
        </Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <PackHeader pack={pack} />
      <WhatsAppSection pack={pack} />
      <StickerList stickers={pack.stickers} identifier={pack.identifier} />
    </ScrollView>
  )
}
