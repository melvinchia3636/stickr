import React, { useState } from 'react'

import { ScrollView, View } from 'react-native'

import { TextInput, useTheme } from 'react-native-paper'

import CreatePackButton from './components/CreatePackButton'
import StickerSection from './components/StickerSection'

export default function CreatePackScreen() {
  const t = useTheme()
  const [packName, setPackName] = useState('')
  const [selectedImages, setSelectedImages] = useState<string[]>([])

  const canCreate = packName.trim() && selectedImages.length >= 3

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <TextInput
          label="Pack Name"
          mode="flat"
          placeholder="My Awesome Stickers"
          value={packName}
          onChangeText={setPackName}
          maxLength={50}
        />
        <StickerSection
          selectedImages={selectedImages}
          onImagesChange={setSelectedImages}
          onChooseLabel={
            selectedImages.length > 0
              ? 'Add More Images'
              : 'Pick Images from Gallery'
          }
        />
        <CreatePackButton
          packName={packName}
          selectedImages={selectedImages}
          disabled={!canCreate}
        />
      </ScrollView>
    </View>
  )
}
