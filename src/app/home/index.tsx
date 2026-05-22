import React, { useState } from 'react'

import { View } from 'react-native'

import { Stack, useRouter } from 'expo-router'

import { IconButton, useTheme } from 'react-native-paper'

import HomeFab from './components/HomeFab'
import HomeHeader from './components/HomeHeader'
import PackList from './components/PackList'

export default function HomeScreen() {
  const t = useTheme()

  const router = useRouter()

  const [packCount, setPackCount] = useState(0)

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              icon="cog"
              iconColor={t.colors.onSurface}
              onPress={() => {
                router.push('/settings')
              }}
            />
          )
        }}
      />
      <HomeHeader count={packCount} />
      <HomeFab />
      <PackList onCountChange={setPackCount} />
    </View>
  )
}
