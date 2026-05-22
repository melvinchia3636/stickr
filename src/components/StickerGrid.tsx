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
      columnWrapperStyle={{ gap: GAP }}
      contentContainerStyle={{ paddingHorizontal: padding, gap: GAP }}
      data={stickers}
      keyExtractor={item => item.id}
      numColumns={3}
      renderItem={({ item }) => (
        <StickerFigure
          identifier={identifier}
          size={size}
          sticker={item}
          onRemove={onRemoveSticker ? () => onRemoveSticker(item) : undefined}
        />
      )}
      scrollEnabled={false}
    />
  )
}
