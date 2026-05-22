import { View } from 'react-native'

import { Icon, Text, useTheme } from 'react-native-paper'

import useAlertAnimation from '../hooks/useAlertAnimation'
import { useAlertStore } from '../providers/AlertProvider'
import AlertActions from './AlertActions'
import AlertWrapper from './AlertWrapper'

export default function AlertPortal() {
  const t = useTheme()

  const { config, closeAlert } = useAlertStore()

  const { visible, opacity, scale, handleClose, lastConfig } =
    useAlertAnimation(config, closeAlert)

  const c = config ?? lastConfig.current

  if (!visible || !c) return null

  return (
    <AlertWrapper
      opacity={opacity}
      scale={scale}
      visible={visible}
      onClose={handleClose}
    >
      {c.icon && (
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Icon
            color={c.iconColor || t.colors.primary}
            size={40}
            source={c.icon}
          />
        </View>
      )}
      {c.title && (
        <Text
          style={{
            textAlign: 'center',
            fontWeight: '600',
            marginBottom: 8,
            color: t.colors.onSurface
          }}
          variant="titleLarge"
        >
          {c.title}
        </Text>
      )}
      {c.message && (
        <Text
          style={{
            textAlign: 'center',
            color: t.colors.onSurfaceVariant,
            marginBottom: 16
          }}
          variant="bodyMedium"
        >
          {c.message}
        </Text>
      )}
      {c.actions && <AlertActions actions={c.actions} onClose={handleClose} />}
    </AlertWrapper>
  )
}
