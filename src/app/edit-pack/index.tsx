import React, { useEffect, useState } from 'react'

import { ScrollView, ToastAndroid, View } from 'react-native'

import { useLocalSearchParams, useRouter } from 'expo-router'

import { useAlertStore } from '@/components/AlertManager'
import StickerGrid from '@/components/StickerGrid'
import {
  deleteSticker,
  getPackWithStickers,
  updatePackName
} from '@/database/packRepository'
import { regenerateContentsJson } from '@/services/contentsJsonGenerator'
import { deleteStickerFile } from '@/services/stickerFileManager'
import { refreshContentProvider } from '@/services/whatsappBridge'
import type { PackWithStickers } from '@/types'
import { Button, Text, TextInput, useTheme } from 'react-native-paper'

export default function EditPackScreen() {
  const { packId } = useLocalSearchParams<{ packId: string }>()
  const t = useTheme()
  const router = useRouter()
  const { openAlert } = useAlertStore()
  const [pack, setPack] = useState<PackWithStickers | null>(null)
  const [newName, setNewName] = useState('')
  useEffect(() => {
    loadPack()
  }, [])

  const loadPack = async () => {
    const p = await getPackWithStickers(packId)
    if (p) {
      setPack(p)
      setNewName(p.name)
    }
  }

  const handleSaveName = async () => {
    const trimmed = newName.trim()
    if (!trimmed) {
      openAlert({
        title: 'Error',
        message: 'Pack name cannot be empty',
        icon: 'alert',
        iconColor: t.colors.error,
        actions: [{ text: 'OK' }]
      })
      return
    }
    await updatePackName(packId, trimmed)
    await regenerateContentsJson(packId)
    await refreshContentProvider()
    ToastAndroid.show('Pack name updated', ToastAndroid.SHORT)
    router.back()
  }

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
      <View style={{ paddingHorizontal: 16, paddingTop: 24, gap: 8 }}>
        <TextInput
          mode="flat"
          label="Pack Name"
          value={newName}
          onChangeText={setNewName}
          maxLength={50}
          style={{ flex: 1 }}
        />
        <Button mode="contained" onPress={handleSaveName} icon="check">
          Save
        </Button>
      </View>

      <Text
        variant="titleMedium"
        style={{
          color: t.colors.onSurface,
          marginTop: 20,
          marginBottom: 8,
          paddingHorizontal: 16
        }}
      >
        Stickers ({pack.stickers.length})
      </Text>

      <StickerGrid
        identifier={pack.identifier}
        stickers={pack.stickers}
        padding={16}
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
