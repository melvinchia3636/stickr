import { useState } from 'react'

import { ToastAndroid, View } from 'react-native'

import { useRouter } from 'expo-router'

import { useAlertStore } from '@/components/ui/AlertManager'
import { updatePackName } from '@/database/repositories'
import { regenerateContentsJson } from '@/services/contentsJsonGenerator'
import { refreshContentProvider } from '@/services/whatsappBridge'
import { Button, TextInput, useTheme } from 'react-native-paper'

export default function PackNameEditor({
  packId,
  initialName
}: {
  packId: string
  initialName: string
}) {
  const t = useTheme()

  const router = useRouter()

  const { openAlert } = useAlertStore()

  const [newName, setNewName] = useState(initialName)

  const handleSaveName = async () => {
    const trimmed = newName.trim()

    if (!trimmed) {
      openAlert({
        title: 'Error',
        message: 'Pack name cannot be empty',
        icon: 'alert',
        iconColor: t.colors.error,
        actions: [{ text: 'OK' }]
      })

      return
    }
    await updatePackName(packId, trimmed)
    await regenerateContentsJson(packId)
    await refreshContentProvider()
    ToastAndroid.show('Pack name updated', ToastAndroid.SHORT)
    router.back()
  }

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 24, gap: 8 }}>
      <TextInput
        label="Pack Name"
        maxLength={50}
        mode="outlined"
        style={{ flex: 1 }}
        value={newName}
        onChangeText={setNewName}
      />
      <Button icon="check" mode="contained" onPress={handleSaveName}>
        Save
      </Button>
    </View>
  )
}
