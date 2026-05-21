import React, { useState } from 'react'

import {
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
  View
} from 'react-native'

import { Image } from 'expo-image'
import { useRouter } from 'expo-router'

import { searchStickerPacks } from '@/services/sigstickApi'
import type { SigStickSearchResult } from '@/types'
import { Icon, Text, TextInput, useTheme } from 'react-native-paper'

export default function SigStickSearchScreen() {
  const router = useRouter()
  const t = useTheme()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SigStickSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    const trimmed = query.trim()
    if (!trimmed) return
    setLoading(true)
    setSearched(true)
    try {
      const packs = await searchStickerPacks(trimmed)
      setResults(packs)
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to search')
      setResults([])
    }
    setLoading(false)
  }

  const renderItem = ({ item }: { item: SigStickSearchResult }) => (
    <TouchableOpacity
      style={{
        flex: 1,
        backgroundColor: t.colors.surface,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1
      }}
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: '/sigstick-result',
          params: { packId: item.id, packTitle: item.title }
        })
      }
    >
      {item.thumbnail ? (
        <Image
          source={{ uri: item.thumbnail }}
          style={{ width: '100%', aspectRatio: 1 }}
          contentFit="contain"
        />
      ) : (
        <View
          style={{
            width: '100%',
            aspectRatio: 1,
            backgroundColor: t.colors.surfaceVariant,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon
            source="sticker-emoji"
            size={40}
            color={t.colors.onSurfaceVariant}
          />
        </View>
      )}
      <Text
        variant="labelMedium"
        style={{ color: t.colors.onSurface, padding: 8 }}
        numberOfLines={2}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  )

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={{ padding: 12, gap: 8 }}>
        <TextInput
          mode="outlined"
          placeholder="Search sticker packs..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          style={{ backgroundColor: t.colors.surface }}
          left={<TextInput.Icon icon="magnify" onPress={handleSearch} />}
        />
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={t.colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : searched && results.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text
            variant="bodyLarge"
            style={{ color: t.colors.onSurfaceVariant }}
          >
            No packs found
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 12 }}
          columnWrapperStyle={{ gap: 12 }}
        />
      )}
    </View>
  )
}
