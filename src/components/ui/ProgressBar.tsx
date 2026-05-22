import React from 'react'

import { Text, View } from 'react-native'

import { ProgressBar as PaperProgressBar, useTheme } from 'react-native-paper'

export default function ProgressBar({
  progress,
  total,
  label
}: {
  progress: number
  total: number
  label?: string
}) {
  const t = useTheme()

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            color: t.colors.onSurfaceVariant,
            marginBottom: 4
          }}
        >
          {label}
        </Text>
      )}
      <PaperProgressBar color={t.colors.primary} progress={pct / 100} />
      <Text
        style={{
          fontSize: 14,
          color: t.colors.onSurfaceVariant,
          marginTop: 4,
          textAlign: 'right'
        }}
      >
        {progress} / {total}
      </Text>
    </View>
  )
}
