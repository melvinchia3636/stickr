import { useAlertStore } from '@/components/ui/AlertManager'
import { isServerHealthy } from '@/services/imageProcessor'
import { useTheme } from 'react-native-paper'

export function useEnsureServerHealthy() {
  const t = useTheme()

  const { openAlert } = useAlertStore()

  async function ensureServerHealthy(): Promise<boolean> {
    const healthy = await isServerHealthy()

    if (!healthy) {
      openAlert({
        title: 'Connection Error',
        message: 'Sticker converter server is not reachable. Please check your connection or server configuration.',
        icon: 'alert',
        iconColor: t.colors.error,
        actions: [{ text: 'OK' }]
      })

      return false
    }

    return true
  }

  return ensureServerHealthy
}
