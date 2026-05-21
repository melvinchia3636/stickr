import React from 'react'

import { Dimensions, FlatList } from 'react-native'

import type { Sticker } from '@/types'

import PackStickerItem from './PackStickerItem'

export default function StickerList({
  stickers,
  identifier
}: {
  stickers: Sticker[]
  identifier: string
}) {
  return (
    <FlatList
      data={stickers}
      renderItem={({ item }) => (
        <PackStickerItem
          sticker={item}
          identifier={identifier}
          size={(Dimensions.get('window').width - 16 * 2 - 2 * 8) / 3}
        />
      )}
      keyExtractor={item => item.id}
      numColumns={3}
      contentContainerStyle={{ padding: 16 }}
      columnWrapperStyle={{ gap: 8 }}
      scrollEnabled={false}
    />
  )
}
