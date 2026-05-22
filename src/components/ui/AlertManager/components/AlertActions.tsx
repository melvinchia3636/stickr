import { View } from 'react-native'

import { Button, useTheme } from 'react-native-paper'

import type { AlertAction } from '../types'

export default function AlertActions({
  actions,
  onClose
}: {
  actions: AlertAction[]
  onClose: () => void
}) {
  const t = useTheme()

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8
      }}
    >
      {actions.map((action, i) => (
        <Button
          key={i}
          buttonColor={
            action.style === 'destructive' ? t.colors.error : undefined
          }
          mode={action.style === 'cancel' ? 'outlined' : 'contained'}
          textColor={
            action.style === 'destructive' ? t.colors.onError : undefined
          }
          onPress={() => {
            action.onPress?.()
            onClose()
          }}
        >
          {action.text}
        </Button>
      ))}
    </View>
  )
}
