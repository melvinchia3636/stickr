import React from 'react'

import { View } from 'react-native'

import { Icon, Text, useTheme } from 'react-native-paper'

export default function WhatsAppAlreadyAddedStatus({
  partsCount
}: {
  partsCount: number
}) {
  const t = useTheme()

  return (
    <View
      style={{
        backgroundColor: t.colors.elevation.level1,
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Icon color={t.colors.primary} size={18} source="check-circle" />
      <Text
        style={{ color: t.colors.primary, marginLeft: 4 }}
        variant="titleSmall"
      >
        {' '}
        Already Added to WhatsApp
        {partsCount > 1 ? ` (${partsCount} parts)` : ''}
      </Text>
    </View>
  )
}
