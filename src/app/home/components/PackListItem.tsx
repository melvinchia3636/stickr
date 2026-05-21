import React, { useState } from 'react'

import { useRouter } from 'expo-router'

import PackCard from '@/components/PackCard'
import { deletePack } from '@/database/packRepository'
import { deletePackDir } from '@/services/stickerFileManager'
import { refreshContentProvider } from '@/services/whatsappBridge'
import type { StickerPack } from '@/types'
import {
  Button,
  Dialog,
  Menu,
  Portal,
  Text,
  useTheme
} from 'react-native-paper'

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
  const [menuVisible, setMenuVisible] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 })
  const [deleteTarget, setDeleteTarget] = useState(false)

  const handleDelete = async () => {
    setDeleteTarget(false)
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
              setDeleteTarget(true)
            }}
            title="Delete"
          />
        </Menu>
      </Portal>

      <Portal>
        <Dialog visible={deleteTarget} onDismiss={() => setDeleteTarget(false)}>
          <Dialog.Icon icon="alert" />
          <Dialog.Title style={{ textAlign: 'center' }}>
            Delete Pack
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
              Are you sure you want to delete "{pack.name}"? This cannot be
              undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center' }}>
            <Button onPress={() => setDeleteTarget(false)}>Cancel</Button>
            <Button textColor={t.colors.error} onPress={handleDelete}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  )
}
