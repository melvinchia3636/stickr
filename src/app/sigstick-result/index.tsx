import React, { useEffect, useState } from 'react'

import { ScrollView, View } from 'react-native'

import { useLocalSearchParams } from 'expo-router'

import { useAlertStore } from '@/components/AlertManager'
import LoadingScreen from '@/components/LoadingScreen'
import StickerGrid from '@/components/StickerGrid'
import StickerPackHeader from '@/components/StickerPackHeader'
import { getStickerPackDetail } from '@/services/sigstickApi'
import { useTheme } from 'react-native-paper'

import SigStickerDownloader from './components/SigStickerDownloader'

export default function SigStickResultScreen() {
  const { packId } = useLocalSearchParams<{ packId: string }>()
  const t = useTheme()
  const { openAlert } = useAlertStore()

  const [stickerUrls, setStickerUrls] = useState<string[]>([])
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [packTitle, setPackTitle] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const detail = await getStickerPackDetail(packId)
        setStickerUrls(detail.stickers)
        setPackTitle(detail.title)
        setCoverUrl(detail.coverUrl)
      } catch (e: any) {
        openAlert({
          title: 'Error',
          message: e.message || 'Failed to load pack',
          icon: 'alert',
          actions: [{ text: 'OK' }]
        })
      }
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const detail = await getStickerPackDetail(packId)
        setStickerUrls(detail.stickers)
        setPackTitle(detail.title)
        setCoverUrl(detail.coverUrl)
      } catch (e: any) {
        openAlert({
          title: 'Error',
          message: e.message || 'Failed to load pack',
          icon: 'alert',
          actions: [{ text: 'OK' }]
        })
      }
      setLoading(false)
    })()
  }, [])

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
          stickers={stickerUrls.map((url, i) => ({
            id: `${i}`,
            packId: packId,
            imageFileName: url,
            emojis: '',
            accessibilityText: '',
            sortOrder: i
          }))}
          identifier={packId}
          padding={16}
        />
      </ScrollView>
      <SigStickerDownloader
        packTitle={packTitle}
        stickerUrls={stickerUrls}
        coverUrl={coverUrl}
      />
    </View>
  )
}
