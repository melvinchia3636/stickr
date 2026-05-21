import { useLayoutEffect } from 'react'

import { useRouter } from 'expo-router'

import { useAlertStore } from '@/components/AlertManager'
import type { PackWithStickers } from '@/types'
import { IconButton, Menu, useTheme } from 'react-native-paper'

export default function useHeaderMenu({
  navigation,
  menuVisible,
  setMenuVisible,
  pack,
  onDelete
}: {
  navigation: any
  menuVisible: boolean
  setMenuVisible: (v: boolean) => void
  pack: PackWithStickers | null
  onDelete: () => void
}) {
  const router = useRouter()
  const { openAlert } = useAlertStore()
  const t = useTheme()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              size={20}
              onPress={() => setMenuVisible(true)}
            />
          }
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
    })
  }, [
    navigation,
    menuVisible,
    pack,
    onDelete,
    openAlert,
    router,
    setMenuVisible,
    t.colors.error
  ])
}
