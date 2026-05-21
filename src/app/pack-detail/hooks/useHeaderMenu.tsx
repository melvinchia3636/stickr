import { useLayoutEffect } from 'react'

import { Alert } from 'react-native'

import { useRouter } from 'expo-router'

import { deletePack } from '@/database/packRepository'
import { deletePackDir } from '@/services/stickerFileManager'
import { refreshContentProvider } from '@/services/whatsappBridge'
import type { PackWithStickers } from '@/types'
import { IconButton, Menu } from 'react-native-paper'

export default function useHeaderMenu({
  navigation,
  menuVisible,
  setMenuVisible,
  pack
}: {
  navigation: any
  menuVisible: boolean
  setMenuVisible: (v: boolean) => void
  pack: PackWithStickers | null
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
              if (!pack) return
              Alert.alert(
                'Delete Pack',
                `Are you sure you want to delete "${pack.name}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      await deletePackDir(pack.identifier)
                      await deletePack(pack.id)
                      await refreshContentProvider()
                      router.back()
                    }
                  }
                ]
              )
            }}
          />
        </Menu>
      )
    })
  }, [navigation, menuVisible, pack])
}
