import React, { useCallback, useEffect, useState } from 'react'

import { ScrollView } from 'react-native'

import { useLocalSearchParams, useRouter } from 'expo-router'

import StickerGrid from '@/components/StickerGrid'
import StickerPackHeader from '@/components/StickerPackHeader'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { deletePack, getPackWithStickers } from '@/database/repositories'
import { deletePackDir, getStickerPath } from '@/services/stickerFileManager'
import { refreshContentProvider } from '@/services/whatsappBridge'
import type { PackWithStickers } from '@/types'
import { useTheme } from 'react-native-paper'

import WhatsAppSection from '../../components/WhatsAppSection'
import HeaderMenu from './components/HeaderMenu'

export default function PackDetailScreen() {
  const router = useRouter()

  const { packId } = useLocalSearchParams<{ packId: string }>()

  const t = useTheme()

  const [pack, setPack] = useState<PackWithStickers | null>(null)

  useEffect(() => {
    ;

(async () => {
      const p = await getPackWithStickers(packId)

      setPack(p)
    })()
  }, [])

  const handleDelete = useCallback(async () => {
    if (!pack) return
    await deletePackDir(pack.identifier)
    await deletePack(pack.id)
    await refreshContentProvider()
    router.back()
  }, [pack, router])

  if (!pack) {
    return <LoadingScreen message="Loading pack..." />
  }

  return (
    <>
      <HeaderMenu pack={pack} onDelete={handleDelete} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        style={{ flex: 1, backgroundColor: t.colors.background }}
      >
        <StickerPackHeader
          imageUri={`file://${getStickerPath(pack.identifier, pack.stickers[0].imageFileName)}`}
          name={pack.name}
          stickerCount={pack.stickers.length}
        />
        <WhatsAppSection pack={pack} />
        <StickerGrid
          identifier={pack.identifier}
          padding={16}
          stickers={pack.stickers}
        />
      </ScrollView>
    </>
  )
}
