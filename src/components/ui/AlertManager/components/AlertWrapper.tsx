import { type ReactNode } from 'react'

import { Animated, Modal, Pressable } from 'react-native'

import { useTheme } from 'react-native-paper'

export default function AlertWrapper({
  visible,
  onClose,
  opacity,
  scale,
  children
}: {
  visible: boolean
  onClose: () => void
  opacity: Animated.Value
  scale: Animated.Value
  children: ReactNode
}) {
  const { colors } = useTheme()

  if (!visible) return null

  return (
    <Modal transparent visible onRequestClose={onClose}>
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            opacity
          }}
        >
          <Pressable onPress={() => {}}>
            <Animated.View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                minWidth: 280,
                maxWidth: 340,
                paddingVertical: 24,
                paddingHorizontal: 16,
                transform: [{ scale }]
              }}
            >
              {children}
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}
