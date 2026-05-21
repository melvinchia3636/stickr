import React, { useState } from 'react'

import { Alert } from 'react-native'

import { useRouter } from 'expo-router'

import ProgressBar from '@/components/ProgressBar'
import { addSticker, createPack } from '@/database/packRepository'
import { regenerateContentsJson } from '@/services/contentsJsonGenerator'
import {
  TRAY_FILE_NAME,
  convertToStickerWebP,
  generateTrayIcon
} from '@/services/imageProcessor'
import { ensureStickersDir } from '@/services/stickerFileManager'
import { refreshContentProvider } from '@/services/whatsappBridge'
import RNFS from 'react-native-fs'
import 'react-native-get-random-values'
import { Button, useTheme } from 'react-native-paper'
import { v4 as uuid } from 'uuid'

interface Props {
  packName: string
  selectedImages: string[]
  disabled: boolean
}

export default function CreatePackButton({
  packName,
  selectedImages,
  disabled
}: Props) {
  const t = useTheme()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)

  const handleCreate = async () => {
    const name = packName.trim()
    if (!name) {
      Alert.alert('Error', 'Please enter a pack name')
      return
    }
    if (selectedImages.length < 3) {
      Alert.alert('Error', 'Please select at least 3 stickers')
      return
    }

    setLoading(true)
    setTotal(selectedImages.length)
    setProgress(0)

    try {
      await ensureStickersDir()
      const identifier = uuid()
      await createPack(name, identifier, TRAY_FILE_NAME)

      for (let i = 0; i < selectedImages.length; i++) {
        const fileName = `sticker_${String(i + 1).padStart(3, '0')}.webp`
        const result = await convertToStickerWebP(
          selectedImages[i]!,
          identifier,
          fileName
        )
        if (!result.success) throw new Error(`Failed to convert image ${i + 1}`)
        await addSticker(uuid(), identifier, fileName, '', i + 1)
        setProgress(i + 1)
      }

      await generateTrayIcon(
        `file://${RNFS.DocumentDirectoryPath}/stickers/${identifier}/sticker_001.webp`,
        identifier
      )
      await regenerateContentsJson(identifier)
      await refreshContentProvider()
      setLoading(false)
      Alert.alert('Success', `Sticker pack "${name}" created!`, [
        {
          text: 'View Pack',
          onPress: () =>
            router.replace({
              pathname: '/pack-detail',
              params: { packId: identifier }
            })
        }
      ])
    } catch (e: any) {
      setLoading(false)
      Alert.alert('Error', e.message || 'Failed')
    }
  }

  return (
    <>
      {loading && (
        <ProgressBar
          progress={progress}
          total={total}
          label="Converting stickers..."
        />
      )}
      <Button
        mode="contained"
        style={{ marginTop: 24 }}
        onPress={handleCreate}
        disabled={disabled || loading}
        icon="plus"
      >
        {loading ? 'Creating...' : 'Create Pack'}
      </Button>
    </>
  )
}
