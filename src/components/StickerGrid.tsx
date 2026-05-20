import React from 'react';
import { View, FlatList, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import type { Sticker } from '@/types';
import { getStickerPath } from '@/services/stickerFileManager';

interface Props {
  identifier: string;
  stickers: Sticker[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - 32 - (NUM_COLUMNS - 1) * 8) / NUM_COLUMNS;

export default function StickerGrid({ identifier, stickers }: Props) {
  const renderItem = ({ item }: { item: Sticker }) => (
    <View style={{ width: ITEM_SIZE, height: ITEM_SIZE, backgroundColor: '#F5F5F5', borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <Image source={{ uri: `file://${getStickerPath(identifier, item.imageFileName)}` }}
        style={{ width: ITEM_SIZE * 0.9, height: ITEM_SIZE * 0.9 }} contentFit="contain"
      />
    </View>
  );

  return (
    <FlatList data={stickers} renderItem={renderItem} keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS} contentContainerStyle={{ padding: 16 }} columnWrapperStyle={{ gap: 8 }}
    />
  );
}
