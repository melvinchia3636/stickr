import React from 'react'

import { View } from 'react-native'

import { Button, Icon, Text, useTheme } from 'react-native-paper'

export default function WhatsAppPartialAddedStatus({
  addedCount,
  totalCount,
  adding,
  onPress
}: {
  addedCount: number
  totalCount: number
  adding: boolean
  onPress: () => Promise<void>
}) {
  const t = useTheme()

  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          backgroundColor: t.colors.elevation.level1,
          paddingVertical: 12,
          borderRadius: 32,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Icon
          color={t.colors.secondary}
          size={18}
          source="check-circle-outline"
        />
        <Text
          style={{ color: t.colors.secondary, marginLeft: 4 }}
          variant="titleSmall"
        >
          {' '}
          {addedCount} of {totalCount} parts added
        </Text>
      </View>
      <Button
        buttonColor={adding ? t.colors.surfaceDisabled : t.colors.primary}
        contentStyle={{ paddingVertical: 8 }}
        disabled={adding}
        icon="whatsapp"
        mode="contained"
        onPress={onPress}
      >
        {adding ? 'Opening WhatsApp...' : 'Add Remaining Parts'}
      </Button>
    </View>
  )
}
