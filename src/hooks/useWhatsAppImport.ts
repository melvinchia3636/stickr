import { useEffect, useState } from 'react'

import { Alert, AppState, type AppStateStatus } from 'react-native'

import { useAlertStore } from '@/components/ui/AlertManager'
import { useEnsureServerHealthy } from '@/hooks/useEnsureServerHealthy'
import { regenerateContentsJson } from '@/services/contentsJsonGenerator'
import { ensureAnimationConsistency } from '@/services/imageProcessor'
import {
  addPackToWhatsApp,
  addSubPackToWhatsApp,
  lastAttemptedIndexGlobal,
  pendingSubPacksGlobal,
  prepareSubPacks,
  setLastAttemptedIndexGlobal,
  setPendingSubPacksGlobal
} from '@/services/packSplitter'
import {
  isStickerPackWhitelisted,
  refreshContentProvider,
  validateStickerPack
} from '@/services/whatsappBridge'
import type { PackWithStickers } from '@/types'

export function useWhatsAppImport(pack: PackWithStickers | null | undefined) {
  const { openAlert } = useAlertStore()

  const [adding, setAdding] = useState(false)

  const [whitelistedParts, setWhitelistedParts] = useState<boolean[]>([])

  const ensureServerHealthy = useEnsureServerHealthy()

  function resetProgression() {
    setPendingSubPacksGlobal([])
    setLastAttemptedIndexGlobal(-1)
    setAdding(false)
  }

  useEffect(() => {
    if (!pack) return

    checkStatus()

    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          checkStatus(true)
        }
      }
    )

    return () => {
      subscription.remove()
    }
  }, [pack])

  async function checkStatus(isForegroundTransition: boolean = false) {
    if (!pack) return

    if (pack.stickers.length <= 30) {
      const wl = await isStickerPackWhitelisted(pack.identifier)

      setWhitelistedParts(wl ? [true] : [false])
      setAdding(false)

      return
    }

    const partCount = Math.ceil(pack.stickers.length / 30)

    if (isForegroundTransition && lastAttemptedIndexGlobal >= 0) {
      const subId = `${pack.identifier}_part${lastAttemptedIndexGlobal + 1}`

      for (let attempt = 0; attempt < 5; attempt++) {
        const isWl = await isStickerPackWhitelisted(subId)

        if (isWl) {
          break
        }
        await new Promise(function (resolve) {
          setTimeout(resolve, 500)
        })
      }
    }

    const results: boolean[] = []

    for (let i = 0; i < partCount; i++) {
      const subId = `${pack.identifier}_part${i + 1}`

      const isWl = await isStickerPackWhitelisted(subId)

      results.push(isWl)
    }

    setWhitelistedParts(results)

    if (!isForegroundTransition || pendingSubPacksGlobal.length === 0) {
      setAdding(false)

      return
    }

    const nextIndex = results.findIndex(x => x === false)

    if (
      nextIndex === -1 ||
      lastAttemptedIndexGlobal < 0 ||
      !results[lastAttemptedIndexGlobal]
    ) {
      resetProgression()

      return
    }

    const nextSubPack = pendingSubPacksGlobal.find(
      sp => sp.identifier === `${pack.identifier}_part${nextIndex + 1}`
    )

    if (!nextSubPack) return

    setAdding(true)

    try {
      setLastAttemptedIndexGlobal(nextIndex)
      setPendingSubPacksGlobal(
        pendingSubPacksGlobal.filter(
          sp => sp.identifier !== nextSubPack.identifier
        )
      )
      await addSubPackToWhatsApp(nextSubPack)
      setTimeout(() => {
        checkStatus()
      }, 1000)
    } catch {
      resetProgression()
    }
  }

  async function handleAddToWhatsApp() {
    if (!pack) return

    const healthy = await ensureServerHealthy()

    if (!healthy) return

    if (pack.stickers.length <= 30) {
      doDirectAdd()

      return
    }

    const firstUnaddedIndex = whitelistedParts.findIndex(x => x === false)

    if (firstUnaddedIndex !== -1 && whitelistedParts.some(Boolean)) {
      setAdding(true)

      try {
        const subPacks = await prepareSubPacks(pack)

        const targetSubPack = subPacks[firstUnaddedIndex]

        if (targetSubPack) {
          setPendingSubPacksGlobal(subPacks.slice(firstUnaddedIndex + 1))
          setLastAttemptedIndexGlobal(firstUnaddedIndex)
          await addSubPackToWhatsApp(targetSubPack)
          setTimeout(() => {
            checkStatus()
          }, 1000)
        }
      } catch (e: unknown) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Failed')
      }

      setAdding(false)

      return
    }

    openAlert({
      title: 'Large Sticker Pack',
      message: `This pack has ${pack.stickers.length} stickers. WhatsApp allows max 30 per pack, so it will be split into multiple packs.`,
      icon: 'information',
      actions: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: doSplitAdd
        }
      ]
    })
  }

  async function doDirectAdd() {
    if (!pack) return

    setAdding(true)

    try {
      await ensureAnimationConsistency(pack.identifier, pack.stickers)
      await regenerateContentsJson(pack.id)
      await refreshContentProvider()

      const validation = await validateStickerPack(pack.identifier)

      if (!validation.valid) {
        Alert.alert(
          'Sticker Pack Validation Failed',
          validation.errors.join('\n'),
          [{ text: 'OK' }]
        )
        setAdding(false)

        return
      }

      await addPackToWhatsApp(pack)
      setTimeout(() => {
        checkStatus()
      }, 1000)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''

      Alert.alert(
        'Error',
        msg.includes('not installed') ? 'Please install WhatsApp.' : msg
      )
    }

    setAdding(false)
  }

  async function doSplitAdd() {
    if (!pack) return

    setAdding(true)

    try {
      const subPacks = await prepareSubPacks(pack)

      setPendingSubPacksGlobal(subPacks.slice(1))
      setLastAttemptedIndexGlobal(0)

      await addSubPackToWhatsApp(subPacks[0])
      setTimeout(() => {
        checkStatus()
      }, 1000)
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed')
      resetProgression()
    }
  }

  return {
    adding,
    whitelisted: pack
      ? whitelistedParts.length > 0 && whitelistedParts.every(Boolean)
      : false,
    whitelistedParts,
    handleAddToWhatsApp
  }
}
