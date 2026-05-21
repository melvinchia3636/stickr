import { useLayoutEffect } from 'react'

import { useRouter } from 'expo-router'

import type { PackWithStickers } from '@/types'
import { IconButton, Menu } from 'react-native-paper'

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
  onDelete?: () => void
}) {
  const router = useRouter()

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
              onDelete?.()
            }}
          />
        </Menu>
      )
    })
  }, [navigation, menuVisible, pack, onDelete])
}
