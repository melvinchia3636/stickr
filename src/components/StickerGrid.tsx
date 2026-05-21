import React from 'react'

import { Dimensions, FlatList } from 'react-native'

import type { Sticker } from '@/types'

import StickerFigure from './StickerFigure'

export default function StickerGrid({
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
        <StickerFigure
          sticker={item}
          identifier={identifier}
          size={(Dimensions.get('window').width - 16 * 2 - 2 * 8) / 3}
        />
      )}
      keyExtractor={item => item.id}
      numColumns={3}
      contentContainerStyle={{ padding: 16, gap: 8 }}
      columnWrapperStyle={{ gap: 8 }}
      scrollEnabled={false}
    />
  )
}
