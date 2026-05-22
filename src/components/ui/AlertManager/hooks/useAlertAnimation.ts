import { useCallback, useEffect, useRef, useState } from 'react'

import { Animated } from 'react-native'

import { AlertConfig } from '../types'

export default function useAlertAnimation(
  config: AlertConfig | null,
  closeAlert: () => void
) {
  const [visible, setVisible] = useState(false)

  const lastConfig = useRef(config)

  const opacity = useRef(new Animated.Value(0)).current

  const scale = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    if (config) {
      lastConfig.current = config
      setVisible(true)
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 60
        })
      ]).start()
    }
  }, [config, opacity, scale])

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 120,
        useNativeDriver: true
      })
    ]).start(() => {
      setVisible(false)
      closeAlert()
    })
  }, [opacity, scale, closeAlert])

  return { visible, opacity, scale, handleClose, lastConfig }
}
