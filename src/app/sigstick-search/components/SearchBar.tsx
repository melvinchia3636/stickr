import React, { useState } from 'react'
import { View } from 'react-native'
import { TextInput, useTheme } from 'react-native-paper'
import { useAlertStore } from '@/components/AlertManager'
import { searchStickerPacks } from '@/services/sigstickApi'
import type { SigStickSearchResult } from '@/types'

interface Props {
  onResults: (results: SigStickSearchResult[]) => void
  onLoadingChange: (loading: boolean) => void
  onSearchedChange: (searched: boolean) => void
}

export default function SearchBar({ onResults, onLoadingChange, onSearchedChange }: Props) {
  const t = useTheme()
  const { openAlert } = useAlertStore()
  const [query, setQuery] = useState('')

  const handleSearch = async () => {
    const trimmed = query.trim()
    if (!trimmed) return
    onLoadingChange(true)
    onSearchedChange(true)
    try {
      const packs = await searchStickerPacks(trimmed)
      onResults(packs)
    } catch (e: any) {
      openAlert({ title: 'Error', message: e.message || 'Failed to search', icon: 'alert', iconColor: '#FF3B30', actions: [{ text: 'OK' }] })
      onResults([])
    }
    onLoadingChange(false)
  }

  return (
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
  )
}
