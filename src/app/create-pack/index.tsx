import React, { useState } from 'react'

import { Alert, Image, ScrollView, TouchableOpacity, View } from 'react-native'

import { useRouter } from 'expo-router'

import LoadingOverlay from '@/components/LoadingOverlay'
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
import { launchImageLibrary } from 'react-native-image-picker'
import { Icon } from 'react-native-paper'
import { Text, TextInput, useTheme } from 'react-native-paper'
import { v4 as uuid } from 'uuid'

export default function CreatePackScreen() {
  const router = useRouter()
  const t = useTheme()
  const [packName, setPackName] = useState('')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)

  const pickImages = () => {
    launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 30, quality: 1 },
      response => {
        if (response.didCancel) return
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Failed')
          return
        }
        const uris = (response.assets || [])
          .map(a => a.uri)
          .filter((u): u is string => !!u)
        setSelectedImages(prev => [...prev, ...uris].slice(0, 30))
      }
    )
  }

  const removeImage = (index: number) =>
    setSelectedImages(prev => prev.filter((_, i) => i !== index))

  const createNewPack = async () => {
    const name = packName.trim()
    if (!name) {
      Alert.alert('Error', 'Please enter a pack name')
      return
    }
    if (selectedImages.length < 3) {
      Alert.alert('Error', 'Please select at least 3 stickers')
      return
    }
    if (selectedImages.length > 30) {
      Alert.alert('Error', 'Maximum 30 stickers')
      return
    }

    setLoading(true)
    setTotal(selectedImages.length)
    setProgress(0)

    try {
      await ensureStickersDir()
      const identifier = generateUUID()
      await createPack(name, identifier, TRAY_FILE_NAME)

      for (let i = 0; i < selectedImages.length; i++) {
        const fileName = `sticker_${String(i + 1).padStart(3, '0')}.webp`
        const result = await convertToStickerWebP(
          selectedImages[i]!,
          identifier,
          fileName
        )
        if (!result.success) throw new Error(`Failed to convert image ${i + 1}`)
        await addSticker(generateUUID(), identifier, fileName, '', i + 1)
        setProgress(i + 1)
      }

      const firstStickerPath = `${RNFS.DocumentDirectoryPath}/stickers/${identifier}/sticker_001.webp`
      await generateTrayIcon(`file://${firstStickerPath}`, identifier)

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

  const canCreate = packName.trim() && selectedImages.length >= 3 && !loading

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <LoadingOverlay visible={loading} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <TextInput
          label="Pack Name"
          mode="flat"
          placeholder="My Awesome Stickers"
          value={packName}
          onChangeText={setPackName}
          maxLength={50}
        />

        <Text
          variant="titleMedium"
          style={{ color: t.colors.onSurface, marginBottom: 6, marginTop: 16 }}
        >
          Stickers ({selectedImages.length}/30)
        </Text>

        {selectedImages.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 8
            }}
          >
            {selectedImages.map((uri, index) => (
              <View
                key={index}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 12,
                  overflow: 'hidden',
                  backgroundColor: t.colors.surfaceVariant
                }}
              >
                <Image source={{ uri }} style={{ width: 80, height: 80 }} />
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onPress={() => removeImage(index)}
                >
                  <Icon source="close" size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={{
            marginTop: 12,
            paddingVertical: 14,
            borderRadius: 12,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: t.colors.primary,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onPress={pickImages}
        >
          <Icon source="plus" size={18} color={t.colors.primary} />
          <Text
            variant="titleSmall"
            style={{ color: t.colors.primary, marginLeft: 4 }}
          >
            {selectedImages.length > 0
              ? 'Add More Images'
              : 'Pick Images from Gallery'}
          </Text>
        </TouchableOpacity>

        {loading && (
          <ProgressBar
            progress={progress}
            total={total}
            label="Converting stickers..."
          />
        )}

        <TouchableOpacity
          style={{
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 24,
            marginBottom: 40,
            backgroundColor: canCreate
              ? t.colors.primary
              : t.colors.surfaceDisabled
          }}
          onPress={createNewPack}
          disabled={!canCreate}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon source="plus-box" size={22} color={t.colors.onPrimary} />
            <Text
              style={{
                color: t.colors.onPrimary,
                fontWeight: '700',
                fontSize: 18
              }}
            >
              Create Pack
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const generateUUID = uuid
