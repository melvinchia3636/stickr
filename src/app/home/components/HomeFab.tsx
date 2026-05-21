import React, { useRef } from 'react'

import { Animated, TouchableOpacity, View } from 'react-native'

import { useRouter } from 'expo-router'

import { Icon, useTheme } from 'react-native-paper'

import FabItem from './FabItem'

export default function HomeFab() {
  const router = useRouter()
  const t = useTheme()
  const anim = useRef(new Animated.Value(0)).current
  const [open, setOpen] = React.useState(false)

  const toggle = () => {
    const next = !open
    setOpen(next)
    Animated.spring(anim, {
      toValue: next ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 60
    }).start()
  }

  const close = (action?: () => void) => {
    setOpen(false)
    Animated.spring(anim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 60
    }).start(() => action?.())
  }

  return (
    <>
      {open && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10
          }}
          activeOpacity={1}
          onPress={() => close()}
        />
      )}

      <View
        style={{
          position: 'absolute',
          bottom: 96,
          right: 24,
          alignItems: 'flex-end',
          zIndex: 20,
          opacity: open ? 1 : 0
        }}
        pointerEvents={open ? 'auto' : 'none'}
      >
        {[
          {
            icon: 'sticker-emoji',
            label: 'Browse SigStick',
            route: '/sigstick-search'
          },
          { icon: 'plus', label: 'Create Pack', route: '/create-pack' }
        ].map((item, i) => (
          <FabItem
            key={item.route}
            icon={item.icon}
            label={item.label}
            index={i}
            anim={anim}
            onPress={() => close(() => router.push(item.route as any))}
          />
        ))}
      </View>

      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          backgroundColor: t.colors.primary,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 30,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 6
        }}
        onPress={toggle}
      >
        <Animated.View
          style={{
            transform: [
              {
                rotate: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '45deg']
                })
              }
            ]
          }}
        >
          <Icon source="plus" size={28} color={t.colors.onPrimary} />
        </Animated.View>
      </TouchableOpacity>
    </>
  )
}
