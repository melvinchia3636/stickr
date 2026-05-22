import React, { useState } from 'react'

import { View } from 'react-native'

import { useAlertStore } from '@/components/ui/AlertManager'
import ProgressBar from '@/components/ui/ProgressBar'
import { getPackWithStickers } from '@/database/repositories'
import { addPackToWhatsApp } from '@/services/packSplitter'
import { downloadSigStickPack } from '@/services/sigstickApi'
import { Button, useTheme } from 'react-native-paper'

export default function SigStickerDownloader({
  packTitle,
  stickerUrls,
  coverUrl,
  sigstickId,
  onDownloaded
}: {
  packTitle: string
  stickerUrls: string[]
  coverUrl: string | null
  sigstickId: string
  onDownloaded?: () => void
}) {
  const t = useTheme()

  const { openAlert } = useAlertStore()

  const [downloading, setDownloading] = useState(false)

  const [downloadProgress, setDownloadProgress] = useState(0)

  async function handleDownload() {
    setDownloading(true)
    setDownloadProgress(0)

    try {
      const identifier = await downloadSigStickPack(
        packTitle,
        stickerUrls,
        coverUrl,
        sigstickId,
        p => setDownloadProgress(p)
      )

      setDownloading(false)
      onDownloaded?.()

      const localPack = await getPackWithStickers(identifier)

      if (!localPack) return

      try {
        await addPackToWhatsApp(localPack)
      } catch (addError: any) {
        openAlert({
          title: 'Error',
          message: addError.message || 'Failed to add to WhatsApp',
          icon: 'alert',
          iconColor: t.colors.error,
          actions: [{ text: 'OK' }]
        })
      }
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
          label="Downloading stickers..."
          progress={downloadProgress}
          total={stickerUrls.length}
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
          buttonColor={
            downloading ? t.colors.surfaceDisabled : t.colors.primary
          }
          contentStyle={{ paddingVertical: 8 }}
          disabled={downloading}
          icon="download"
          mode="contained"
          onPress={handleDownload}
        >
          {downloading ? 'Downloading...' : 'Download & Add to My Packs'}
        </Button>
      </View>
    </>
  )
}
