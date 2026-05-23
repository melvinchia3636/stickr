import React from 'react'

import { FlatList } from 'react-native'

import EmptyState from '@/components/ui/EmptyState'
import LoadingScreen from '@/components/ui/LoadingScreen'
import type { SigStickSearchResult } from '@/types'

import SigStickSearchCard from './SigStickSearchCard'

export default function SigStickSearchResults({
  results,
  loading,
  searched,
  downloadedIds
}: {
  results: SigStickSearchResult[]
  loading: boolean
  searched: boolean
  downloadedIds: Set<string>
}) {
  if (loading) {
    return <LoadingScreen message="Searching..." />
  }

  if (!searched) {
    return (
      <EmptyState
        message="Search SigStick"
        subtitle="Enter a query above to search and download high-quality sticker packs"
      />
    )
  }

  if (searched && results.length === 0) {
    return <EmptyState message="No packs found" />
  }

  return (
    <FlatList
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ padding: 12 }}
      data={results}
      extraData={downloadedIds}
      keyExtractor={item => item.id}
      numColumns={2}
      renderItem={({ item }) => (
        <SigStickSearchCard
          isDownloaded={downloadedIds.has(String(item.id))}
          item={item}
        />
      )}
    />
  )
}
