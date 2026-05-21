import React, { useState } from 'react'

import { View } from 'react-native'

import { useRouter } from 'expo-router'

import { useAlertStore } from '@/components/AlertManager'
import ProgressBar from '@/components/ProgressBar'
import { addSticker, createPack } from '@/database/packRepository'
import { regenerateContentsJson } from '@/services/contentsJsonGenerator'
import {
  TRAY_FILE_NAME,
  convertToStickerWebP,
  generateTrayIcon
} from '@/services/imageProcessor'
import { downloadStickerToFile } from '@/services/sigstickApi'
import { ensureStickersDir } from '@/services/stickerFileManager'
import { refreshContentProvider } from '@/services/whatsappBridge'
import RNFS from 'react-native-fs'
import 'react-native-get-random-values'
import { Button, Icon, useTheme } from 'react-native-paper'
import { v4 as uuid } from 'uuid'

export default function SigStickerDownloader({
  packTitle,
  stickerUrls,
  coverUrl
}: {
  packTitle: string
  stickerUrls: string[]
  coverUrl: string | null
}) {
  const t = useTheme()
  const router = useRouter()
  const { openAlert } = useAlertStore()
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const handleDownload = async () => {
    setDownloading(true)
    setDownloadProgress(0)

    try {
      const identifier = uuid()
      await ensureStickersDir()
      const stickerDir = `${RNFS.DocumentDirectoryPath}/stickers/${identifier}`
      await RNFS.mkdir(stickerDir)
      await createPack(packTitle || 'SigStick Pack', identifier, TRAY_FILE_NAME)

      for (let i = 0; i < stickerUrls.length; i++) {
        const fileName = `sticker_${String(i + 1).padStart(3, '0')}.webp`
        const tmpPath = `${stickerDir}/tmp_${fileName}`
        await downloadStickerToFile(stickerUrls[i]!, tmpPath)
        await convertToStickerWebP(`file://${tmpPath}`, identifier, fileName)
        await RNFS.unlink(tmpPath)
        await addSticker(uuid(), identifier, fileName, '', i + 1)
        setDownloadProgress(i + 1)
      }

      if (coverUrl) {
        const coverTmpPath = `${stickerDir}/cover_tmp.webp`
        await downloadStickerToFile(coverUrl, coverTmpPath)
        await generateTrayIcon(`file://${coverTmpPath}`, identifier)
        await RNFS.unlink(coverTmpPath)
      } else {
        await generateTrayIcon(
          `file://${stickerDir}/sticker_001.webp`,
          identifier
        )
      }

      await regenerateContentsJson(identifier)
      await refreshContentProvider()

      setDownloading(false)
      openAlert({
        title: 'Success',
        message: `"${packTitle}" has been added to your packs!`,
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
      setDownloading(false)
      openAlert({
        title: 'Error',
        message: e.message || 'Failed to download pack',
        icon: 'alert',
        iconColor: t.colors.error,
        actions: [{ text: 'OK' }]
      })
    }
  }

  return (
    <>
      {downloading && (
        <ProgressBar
          progress={downloadProgress}
          total={stickerUrls.length}
          label="Downloading stickers..."
        />
      )}
      <View
        style={{
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: t.colors.outlineVariant,
          backgroundColor: t.colors.background
        }}
      >
        <Button
          mode="contained"
          buttonColor={
            downloading ? t.colors.surfaceDisabled : t.colors.primary
          }
          contentStyle={{ paddingVertical: 8 }}
          onPress={handleDownload}
          disabled={downloading}
          icon="download"
        >
          {downloading ? 'Downloading...' : 'Download & Add to My Packs'}
        </Button>
      </View>
    </>
  )
}
