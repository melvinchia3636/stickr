import React, { useCallback, useEffect, useState } from 'react'

import { ScrollView, View } from 'react-native'

import { useLocalSearchParams } from 'expo-router'

import { useAlertStore } from '@/components/AlertManager'
import LoadingScreen from '@/components/LoadingScreen'
import StickerGrid from '@/components/StickerGrid'
import StickerPackHeader from '@/components/StickerPackHeader'
import { getPackWithStickersBySigstickId } from '@/database/packRepository'
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

  const checkDownloaded = useCallback(
    function () {
      const pack = getPackWithStickersBySigstickId(packId)
      setDownloadedPack(pack)
    },
    [packId]
  )

  useEffect(
    function () {
      let active = true
      async function loadData() {
        try {
          const detail = await getStickerPackDetail(packId)
          if (!active) return
          setStickerUrls(detail.stickers)
          setPackTitle(detail.title)
          setCoverUrl(detail.coverUrl)
        } catch (e: any) {
          if (!active) return
          openAlert({
            title: 'Error',
            message: e.message || 'Failed to load pack',
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
      return function () {
        active = false
      }
    },
    [packId, checkDownloaded]
  )

  if (loading) {
    return <LoadingScreen message="Loading pack..." />
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView>
        <StickerPackHeader
          name={packTitle}
          stickerCount={stickerUrls.length}
          imageUri={coverUrl}
        />
        <StickerGrid
          stickers={stickerUrls.map(function (url, i) {
            return {
              id: `${i}`,
              packId: packId,
              imageFileName: url,
              emojis: '',
              accessibilityText: '',
              sortOrder: i
            }
          })}
          identifier={packId}
          padding={16}
        />
      </ScrollView>
      {downloadedPack ? (
        <WhatsAppSection pack={downloadedPack} />
      ) : (
        <SigStickerDownloader
          packTitle={packTitle}
          stickerUrls={stickerUrls}
          coverUrl={coverUrl}
          sigstickId={packId}
          onDownloaded={checkDownloaded}
        />
      )}
    </View>
  )
}
