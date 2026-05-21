import React, { useCallback, useState } from 'react'

import { View } from 'react-native'

import { useFocusEffect } from 'expo-router'

import { getAllPacks } from '@/database/packRepository'
import type { SigStickSearchResult } from '@/types'
import { useTheme } from 'react-native-paper'

import SearchBar from './components/SearchBar'
import SigStickSearchResults from './components/SigStickSearchResults'

export default function SigStickSearchScreen() {
  const t = useTheme()
  const [results, setResults] = useState<SigStickSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set())

  const loadDownloadedPacks = useCallback(() => {
    const all = getAllPacks()
    setDownloadedIds(
      new Set(
        all
          .map(p => (p.sigstickId ? String(p.sigstickId) : null))
          .filter((id): id is string => !!id)
      )
    )
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadDownloadedPacks()
    }, [loadDownloadedPacks])
  )

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <SearchBar
        onResults={setResults}
        onLoadingChange={setLoading}
        onSearchedChange={setSearched}
      />
      <SigStickSearchResults
        results={results}
        loading={loading}
        searched={searched}
        downloadedIds={downloadedIds}
      />
    </View>
  )
}
