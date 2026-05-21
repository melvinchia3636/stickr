import React, { useEffect, useState } from 'react'

import { Alert, ScrollView, View } from 'react-native'

import { useLocalSearchParams } from 'expo-router'

import LoadingScreen from '@/components/LoadingScreen'
import StickerGrid from '@/components/StickerGrid'
import StickerPackHeader from '@/components/StickerPackHeader'
import { getStickerPackDetail } from '@/services/sigstickApi'
import { useTheme } from 'react-native-paper'

import SigStickerDownloader from './components/SigStickerDownloader'

export default function SigStickResultScreen() {
  const { packId } = useLocalSearchParams<{ packId: string }>()
  const t = useTheme()

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
        Alert.alert('Error', e.message || 'Failed to load pack')
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
