import React from 'react'

import { Dimensions, FlatList } from 'react-native'

import type { Sticker } from '@/types'

import StickerFigure from './StickerFigure'

const GAP = 8
const SCREEN_WIDTH = Dimensions.get('window').width

export default function StickerGrid({
  stickers,
  identifier,
  padding = 0,
  onRemoveSticker
}: {
  stickers: Sticker[]
  identifier: string
  padding?: number
  onRemoveSticker?: (sticker: Sticker) => void
}) {
  const size = (SCREEN_WIDTH - padding * 2 - (3 - 1) * GAP) / 3

  return (
    <FlatList
      data={stickers}
      renderItem={({ item }) => (
        <StickerFigure
          sticker={item}
          identifier={identifier}
          size={size}
          onRemove={onRemoveSticker ? () => onRemoveSticker(item) : undefined}
        />
      )}
      keyExtractor={item => item.id}
      numColumns={3}
      contentContainerStyle={{ paddingHorizontal: padding, gap: GAP }}
      columnWrapperStyle={{ gap: GAP }}
      scrollEnabled={false}
    />
  )
}
