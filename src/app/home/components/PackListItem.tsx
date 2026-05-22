import React, { useState } from 'react'

import { useRouter } from 'expo-router'

import PackCard from '@/components/PackCard'
import { useAlertStore } from '@/components/ui/AlertManager'
import { deletePack } from '@/database/repositories'
import { deletePackDir } from '@/services/stickerFileManager'
import { refreshContentProvider } from '@/services/whatsappBridge'
import type { StickerPack } from '@/types'
import { Menu, Portal, useTheme } from 'react-native-paper'

export default function PackListItem({
  pack,
  stickerCount,
  onDeleted
}: {
  pack: StickerPack
  stickerCount: number
  onDeleted: () => void
}) {
  const router = useRouter()

  const t = useTheme()

  const { openAlert } = useAlertStore()

  const [menuVisible, setMenuVisible] = useState(false)

  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 })

  const handleDelete = async () => {
    await deletePackDir(pack.identifier)
    await deletePack(pack.id)
    await refreshContentProvider()
    onDeleted()
  }

  return (
    <>
      <PackCard
        pack={pack}
        stickerCount={stickerCount}
        onMenuPress={(x, y) => {
          setMenuAnchor({ x: x + 20, y: y + 20 })
          setMenuVisible(true)
        }}
        onPress={() =>
          router.push({ pathname: '/pack-detail', params: { packId: pack.id } })
        }
      />

      <Portal>
        <Menu
          anchor={menuAnchor}
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
                params: { packId: pack.id }
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
                message: `Are you sure you want to delete "${pack.name}"? This cannot be undone.`,
                icon: 'alert',
                iconColor: t.colors.error,
                actions: [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: handleDelete
                  }
                ]
              })
            }}
          />
        </Menu>
      </Portal>
    </>
  )
}
