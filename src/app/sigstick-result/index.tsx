import React, { useEffect, useState } from 'react'

import {
  Alert,
  Dimensions,
  FlatList,
  TouchableOpacity,
  View
} from 'react-native'

import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'

import LoadingOverlay from '@/components/LoadingOverlay'
import ProgressBar from '@/components/ProgressBar'
import { addSticker, createPack } from '@/database/packRepository'
import { regenerateContentsJson } from '@/services/contentsJsonGenerator'
import {
  TRAY_FILE_NAME,
  convertToStickerWebP,
  generateTrayIcon
} from '@/services/imageProcessor'
import {
  downloadStickerToFile,
  getStickerPackDetail
} from '@/services/sigstickApi'
import { ensureStickersDir } from '@/services/stickerFileManager'
import { refreshContentProvider } from '@/services/whatsappBridge'
import type { RootStackParamList } from '@/types'
import RNFS from 'react-native-fs'
import { Icon } from 'react-native-paper'
import { Button, Text, useTheme } from 'react-native-paper'

const SCREEN_WIDTH = Dimensions.get('window').width
const NUM_COLUMNS = 3
const ITEM_SIZE = (SCREEN_WIDTH - 32 - (NUM_COLUMNS - 1) * 8) / NUM_COLUMNS

export default function SigStickResultScreen() {
  const router = useRouter()
  const {
    packId,
    packTitle: paramTitle,
    stickers: paramStickers
  } = useLocalSearchParams<{
    packId: string
    packTitle?: string
    stickers?: string
  }>()
  const t = useTheme()
  const packIdStr = packId

  const [stickerUrls, setStickerUrls] = useState<string[]>([])
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [packTitle, setPackTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  useEffect(() => {
    loadPackDetail()
  }, [])

  const loadPackDetail = async () => {
    try {
      const detail = await getStickerPackDetail(packId)
      setStickerUrls(detail.stickers)
      setPackTitle(detail.title)
      setCoverUrl(detail.coverUrl)
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load pack')
    }
    setLoading(false)
  }

  const handleDownload = async () => {
    setDownloading(true)
    setDownloadProgress(0)

    try {
      const identifier = generateUUID()
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
        await addSticker(generateUUID(), identifier, fileName, '', i + 1)
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
      Alert.alert('Success', `"${packTitle}" has been added to your packs!`, [
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
      setDownloading(false)
      Alert.alert('Error', e.message || 'Failed to download pack')
    }
  }

  const renderItem = ({ item }: { item: string }) => (
    <View
      style={{
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        backgroundColor: t.colors.surface,
        borderRadius: 8,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8
      }}
    >
      <Image
        source={{ uri: item }}
        style={{ width: ITEM_SIZE * 0.85, height: ITEM_SIZE * 0.85 }}
        contentFit="contain"
      />
    </View>
  )

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="bodyLarge" style={{ color: t.colors.onSurfaceVariant }}>
          Loading pack...
        </Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <LoadingOverlay visible={downloading} />

      <Text
        variant="headlineSmall"
        style={{
          fontWeight: '700',
          color: t.colors.onSurface,
          paddingHorizontal: 16,
          paddingTop: 16
        }}
      >
        {packTitle}
      </Text>
      <Text
        variant="bodySmall"
        style={{
          color: t.colors.onSurfaceVariant,
          paddingHorizontal: 16,
          paddingBottom: 12
        }}
      >
        {stickerUrls.length} stickers
      </Text>

      <FlatList
        data={stickerUrls}
        renderItem={renderItem}
        keyExtractor={(item, i) => `${i}`}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={{ padding: 16 }}
        columnWrapperStyle={{ gap: 8 }}
      />

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
          borderTopColor: t.colors.outlineVariant
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
          icon={() => (
            <Icon source="download" size={22} color={t.colors.onPrimary} />
          )}
        >
          {downloading ? 'Downloading...' : 'Download & Add to My Packs'}
        </Button>
      </View>
    </View>
  )
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
