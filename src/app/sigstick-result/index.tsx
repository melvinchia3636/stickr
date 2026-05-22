import React, { useCallback, useEffect, useState } from 'react'

import { ScrollView, View } from 'react-native'

import { useLocalSearchParams } from 'expo-router'

import StickerGrid from '@/components/StickerGrid'
import StickerPackHeader from '@/components/StickerPackHeader'
import { useAlertStore } from '@/components/ui/AlertManager'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { getPackWithStickersBySigstickId } from '@/database/repositories'
import { getStickerPackDetail } from '@/services/sigstickApi'
import type { PackWithStickers } from '@/types'
import { useTheme } from 'react-native-paper'

import WhatsAppSection from '../../components/WhatsAppSection'
import SigStickerDownloader from './components/SigStickerDownloader'

export default function SigStickResultScreen() {
  const { packId } = useLocalSearchParams<{ packId: string }>()

  const t = useTheme()

  const { openAlert } = useAlertStore()

  const [stickerUrls, setStickerUrls] = useState<string[]>([])

  const [coverUrl, setCoverUrl] = useState<string | null>(null)

  const [packTitle, setPackTitle] = useState('')

  const [loading, setLoading] = useState(true)

  const [downloadedPack, setDownloadedPack] = useState<PackWithStickers | null>(
    null
  )

  const checkDownloaded = useCallback(async () => {
    const pack = await getPackWithStickersBySigstickId(packId)

    setDownloadedPack(pack)
  }, [packId])

  useEffect(() => {
    let active = true

    const loadData = async () => {
      try {
        const detail = await getStickerPackDetail(packId)

        if (!active) return
        setStickerUrls(detail.stickers)
        setPackTitle(detail.title)
        setCoverUrl(detail.coverUrl)
      } catch (e: unknown) {
        if (!active) return

        const errorMsg = e instanceof Error ? e.message : 'Failed to load pack'

        openAlert({
          title: 'Error',
          message: errorMsg,
          icon: 'alert',
          actions: [{ text: 'OK' }]
        })
      }

      if (active) {
        setLoading(false)
      }
    }

    loadData()
    checkDownloaded()

    return () => {
      active = false
    }
  }, [packId, checkDownloaded])

  if (loading) {
    return <LoadingScreen message="Loading pack..." />
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView>
        <StickerPackHeader
          imageUri={coverUrl}
          name={packTitle}
          stickerCount={stickerUrls.length}
        />
        <StickerGrid
          identifier={packId}
          padding={16}
          stickers={stickerUrls.map((url, i) => ({
            id: `${i}`,
            packId: packId,
            imageFileName: url,
            emojis: '',
            accessibilityText: '',
            sortOrder: i
          }))}
        />
      </ScrollView>
      {downloadedPack ? (
        <WhatsAppSection pack={downloadedPack} />
      ) : (
        <SigStickerDownloader
          coverUrl={coverUrl}
          packTitle={packTitle}
          sigstickId={packId}
          stickerUrls={stickerUrls}
          onDownloaded={checkDownloaded}
        />
      )}
    </View>
  )
}
