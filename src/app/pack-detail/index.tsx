import React, { useEffect, useState } from 'react'

import { ScrollView } from 'react-native'

import { useLocalSearchParams, useNavigation } from 'expo-router'

import LoadingScreen from '@/components/LoadingScreen'
import StickerGrid from '@/components/StickerGrid'
import StickerPackHeader from '@/components/StickerPackHeader'
import { getPackWithStickers } from '@/database/packRepository'
import { getStickerPath } from '@/services/stickerFileManager'
import type { PackWithStickers } from '@/types'
import { useTheme } from 'react-native-paper'

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
    return <LoadingScreen message="Loading pack..." />
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <StickerPackHeader
        name={pack.name}
        stickerCount={pack.stickers.length}
        imageUri={`file://${getStickerPath(pack.identifier, pack.stickers[0].imageFileName)}`}
      />
      <WhatsAppSection pack={pack} />
      <StickerGrid stickers={pack.stickers} identifier={pack.identifier} />
    </ScrollView>
  )
}
