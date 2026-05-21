import React, { useState } from 'react'

import { Alert, View } from 'react-native'

import { searchStickerPacks } from '@/services/sigstickApi'
import type { SigStickSearchResult } from '@/types'
import { TextInput, useTheme } from 'react-native-paper'

import SigStickSearchResults from './components/SigStickSearchResults'

export default function SigStickSearchScreen() {
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
      <SigStickSearchResults
        results={results}
        loading={loading}
        searched={searched}
      />
    </View>
  )
}
