import React, { useState } from 'react'

import { useRouter } from 'expo-router'

import { useAlertStore } from '@/components/AlertManager'
import PackCard from '@/components/PackCard'
import { deletePack } from '@/database/packRepository'
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
        onPress={() =>
          router.push({ pathname: '/pack-detail', params: { packId: pack.id } })
        }
        onMenuPress={(x, y) => {
          setMenuAnchor({ x: x + 20, y: y + 20 })
          setMenuVisible(true)
        }}
      />

      <Portal>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={menuAnchor}
        >
          <Menu.Item
            leadingIcon="pencil"
            onPress={() => {
              setMenuVisible(false)
              router.push({
                pathname: '/edit-pack',
                params: { packId: pack.id }
              })
            }}
            title="Edit"
          />
          <Menu.Item
            leadingIcon="delete"
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
            title="Delete"
          />
        </Menu>
      </Portal>
    </>
  )
}
