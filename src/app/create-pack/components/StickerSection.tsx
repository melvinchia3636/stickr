import React from 'react'

import { Image, TouchableOpacity, View } from 'react-native'

import { useAlertStore } from '@/components/AlertManager'
import { launchImageLibrary } from 'react-native-image-picker'
import { Icon, Text, useTheme } from 'react-native-paper'

export default function StickerSection({
  selectedImages,
  onImagesChange,
  onChooseLabel
}: {
  selectedImages: string[]
  onImagesChange: (uris: string[]) => void
  onChooseLabel: string
}) {
  const t = useTheme()
  const { openAlert } = useAlertStore()

  const pickImages = () =>
    launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 30, quality: 1 },
      response => {
        if (response.didCancel) return
        if (response.errorCode) {
          openAlert({
            title: 'Error',
            message: response.errorMessage || 'Failed to pick images',
            icon: 'alert',
            iconColor: t.colors.error,
            actions: [{ text: 'OK' }]
          })
          return
        }
        const uris = (response.assets || [])
          .map(a => a.uri)
          .filter((u): u is string => !!u)
        onImagesChange([...selectedImages, ...uris].slice(0, 30))
      }
    )

  const removeImage = (index: number) =>
    onImagesChange(selectedImages.filter((_, i) => i !== index))

  return (
    <>
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
          {onChooseLabel}
        </Text>
      </TouchableOpacity>
    </>
  )
}
