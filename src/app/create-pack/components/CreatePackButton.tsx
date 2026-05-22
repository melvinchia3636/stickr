import React, { useState } from 'react'

import { useRouter } from 'expo-router'

import { useAlertStore } from '@/components/ui/AlertManager'
import ProgressBar from '@/components/ui/ProgressBar'
import { addSticker, createPack } from '@/database/repositories'
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

export default function CreatePackButton({
  packName,
  selectedImages,
  disabled
}: {
  packName: string
  selectedImages: string[]
  disabled: boolean
}) {
  const t = useTheme()

  const router = useRouter()

  const { openAlert } = useAlertStore()

  const [loading, setLoading] = useState(false)

  const [progress, setProgress] = useState(0)

  const [total, setTotal] = useState(0)

  const handleCreate = async () => {
    const name = packName.trim()

    if (!name) {
      openAlert({
        title: 'Error',
        message: 'Please enter a pack name',
        icon: 'alert',
        iconColor: t.colors.error,
        actions: [{ text: 'OK' }]
      })

      return
    }

    if (selectedImages.length < 3) {
      openAlert({
        title: 'Error',
        message: 'Please select at least 3 stickers',
        icon: 'alert',
        iconColor: t.colors.error,
        actions: [{ text: 'OK' }]
      })

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
      openAlert({
        title: 'Success',
        message: `Sticker pack "${name}" created!`,
        icon: 'check-circle',
        iconColor: t.colors.primary,
        actions: [
          {
            text: 'View Pack',
            onPress: () =>
              router.replace({
                pathname: '/pack-detail',
                params: { packId: identifier }
              })
          }
        ]
      })
    } catch (e: any) {
      setLoading(false)
      openAlert({
        title: 'Error',
        message: e.message || 'Failed',
        icon: 'alert',
        iconColor: t.colors.error,
        actions: [{ text: 'OK' }]
      })
    }
  }

  return (
    <>
      {loading && (
        <ProgressBar
          label="Converting stickers..."
          progress={progress}
          total={total}
        />
      )}
      <Button
        disabled={disabled || loading}
        icon="plus"
        mode="contained"
        style={{ marginTop: 24 }}
        onPress={handleCreate}
      >
        {loading ? 'Creating...' : 'Create Pack'}
      </Button>
    </>
  )
}
