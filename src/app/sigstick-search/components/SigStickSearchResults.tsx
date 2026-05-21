import React from 'react'

import { FlatList } from 'react-native'

import EmptyState from '@/components/EmptyState'
import LoadingScreen from '@/components/LoadingScreen'
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

  if (searched && results.length === 0) {
    return <EmptyState message="No packs found" />
  }

  return (
    <FlatList
      data={results}
      extraData={downloadedIds}
      renderItem={function ({ item }) {
        return (
          <SigStickSearchCard
            item={item}
            isDownloaded={downloadedIds.has(String(item.id))}
          />
        )
      }}
      keyExtractor={function (item) {
        return item.id
      }}
      numColumns={2}
      contentContainerStyle={{ padding: 12 }}
      columnWrapperStyle={{ gap: 12 }}
    />
  )
}
