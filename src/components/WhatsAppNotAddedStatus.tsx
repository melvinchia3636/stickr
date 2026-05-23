import React from 'react'

import { Button, useTheme } from 'react-native-paper'

export default function WhatsAppNotAddedStatus({
  adding,
  onPress
}: {
  adding: boolean
  onPress: () => Promise<void>
}) {
  const t = useTheme()

  return (
    <Button
      buttonColor={adding ? t.colors.surfaceDisabled : t.colors.primary}
      disabled={adding}
      icon="whatsapp"
      mode="contained"
      onPress={onPress}
    >
      {adding ? 'Opening WhatsApp...' : 'Add to WhatsApp'}
    </Button>
  )
}
