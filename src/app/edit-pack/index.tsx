import React, { useCallback, useEffect, useState } from 'react'

import { ScrollView } from 'react-native'

import { useLocalSearchParams } from 'expo-router'

import StickerGrid from '@/components/StickerGrid'
import { useAlertStore } from '@/components/ui/AlertManager'
import { deleteSticker, getPackWithStickers } from '@/database/repositories'
import { regenerateContentsJson } from '@/services/contentsJsonGenerator'
import { deleteStickerFile } from '@/services/stickerFileManager'
import { refreshContentProvider } from '@/services/whatsappBridge'
import type { PackWithStickers } from '@/types'
import { Text, useTheme } from 'react-native-paper'

import PackNameEditor from './components/PackNameEditor'

export default function EditPackScreen() {
  const { packId } = useLocalSearchParams<{ packId: string }>()

  const t = useTheme()

  const { openAlert } = useAlertStore()

  const [pack, setPack] = useState<PackWithStickers | null>(null)

  const loadPack = useCallback(async () => {
    const p = await getPackWithStickers(packId)

    if (p) {
      setPack(p)
    }
  }, [packId])

  useEffect(() => {
    loadPack()
  }, [loadPack])

  const handleDeleteSticker = async (stickerId: string, fileName: string) => {
    if (!pack) return
    await deleteStickerFile(pack.identifier, fileName)
    await deleteSticker(stickerId)
    await regenerateContentsJson(packId)
    await refreshContentProvider()
    await loadPack()
  }

  if (!pack) return null

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 40 }}
      style={{ flex: 1, backgroundColor: t.colors.background }}
    >
      <PackNameEditor initialName={pack.name} packId={packId} />
      <Text
        style={{
          color: t.colors.onSurface,
          marginTop: 20,
          marginBottom: 8,
          paddingHorizontal: 16
        }}
        variant="titleMedium"
      >
        Stickers ({pack.stickers.length})
      </Text>
      <StickerGrid
        identifier={pack.identifier}
        padding={16}
        stickers={pack.stickers}
        onRemoveSticker={s =>
          openAlert({
            title: 'Delete Sticker',
            message: 'Remove this sticker from the pack?',
            icon: 'alert',
            iconColor: t.colors.error,
            actions: [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => handleDeleteSticker(s.id, s.imageFileName)
              }
            ]
          })
        }
      />
    </ScrollView>
  )
}
