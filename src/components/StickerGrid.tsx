import React from 'react'

import { Dimensions, View } from 'react-native'

import { Image } from 'expo-image'

import { getStickerPath } from '@/services/stickerFileManager'
import type { Sticker } from '@/types'

const SCREEN_WIDTH = Dimensions.get('window').width
const NUM_COLUMNS = 3
const GAP = 8
const ITEM_SIZE = (SCREEN_WIDTH - 32 - (NUM_COLUMNS - 1) * GAP) / NUM_COLUMNS

export default function StickerGrid({
  identifier,
  stickers
}: {
  identifier: string
  stickers: Sticker[]
}) {
  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP, padding: 16 }}
    >
      {stickers.map(item => (
        <View
          key={item.id}
          style={{
            width: ITEM_SIZE,
            height: ITEM_SIZE,
            backgroundColor: '#F5F5F5',
            borderRadius: 8,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Image
            source={{
              uri: `file://${getStickerPath(identifier, item.imageFileName)}`
            }}
            style={{ width: ITEM_SIZE * 0.9, height: ITEM_SIZE * 0.9 }}
            contentFit="contain"
          />
        </View>
      ))}
    </View>
  )
}
