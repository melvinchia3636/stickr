import React from 'react'

import { FlatList } from 'react-native'

import EmptyState from '@/components/EmptyState'
import LoadingScreen from '@/components/LoadingScreen'
import type { SigStickSearchResult } from '@/types'

import SigStickSearchCard from './SigStickSearchCard'

export default function SigStickSearchResults({
  results,
  loading,
  searched
}: {
  results: SigStickSearchResult[]
  loading: boolean
  searched: boolean
}) {
  if (loading) {
    return <LoadingScreen message="Searching..." />
  }

  if (searched && results.length === 0) {
    return <EmptyState message="No packs found" />
  }

  return (
    <FlatList
      data={results}
      renderItem={({ item }) => <SigStickSearchCard item={item} />}
      keyExtractor={item => item.id}
      numColumns={2}
      contentContainerStyle={{ padding: 12 }}
      columnWrapperStyle={{ gap: 12 }}
    />
  )
}
