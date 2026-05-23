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
          maxLength={50}
          mode="outlined"
          placeholder="My Awesome Stickers"
          value={packName}
          onChangeText={setPackName}
        />
        <StickerSection
          selectedImages={selectedImages}
          onChooseLabel={
            selectedImages.length > 0
              ? 'Add More Images'
              : 'Pick Images from Gallery'
          }
          onImagesChange={setSelectedImages}
        />
        <CreatePackButton
          disabled={!canCreate}
          packName={packName}
          selectedImages={selectedImages}
        />
      </ScrollView>
    </View>
  )
}
