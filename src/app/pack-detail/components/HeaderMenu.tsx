import React, { useState } from 'react'

import { Stack, useRouter } from 'expo-router'

import { useAlertStore } from '@/components/ui/AlertManager'
import type { PackWithStickers } from '@/types'
import { IconButton, Menu, useTheme } from 'react-native-paper'

export default function HeaderMenu({
  pack,
  onDelete
}: {
  pack: PackWithStickers | null
  onDelete: () => void
}) {
  const router = useRouter()

  const { openAlert } = useAlertStore()

  const t = useTheme()

  const [menuVisible, setMenuVisible] = useState(false)

  return (
    <Stack.Screen
      options={{
        headerRight: () => (
          <Menu
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => setMenuVisible(true)}
              />
            }
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
          >
            <Menu.Item
              leadingIcon="pencil"
              title="Edit"
              onPress={() => {
                setMenuVisible(false)
                router.push({
                  pathname: '/edit-pack',
                  params: { packId: pack?.id }
                })
              }}
            />
            <Menu.Item
              leadingIcon="delete"
              title="Delete"
              onPress={() => {
                setMenuVisible(false)
                openAlert({
                  title: 'Delete Pack',
                  message: `Are you sure you want to delete "${pack?.name}"?`,
                  icon: 'alert',
                  iconColor: t.colors.error,
                  actions: [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: onDelete
                    }
                  ]
                })
              }}
            />
          </Menu>
        )
      }}
    />
  )
}
