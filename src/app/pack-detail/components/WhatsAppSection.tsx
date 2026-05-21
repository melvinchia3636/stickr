import React, { useRef, useState } from 'react'

import { Alert, View } from 'react-native'

import { regenerateContentsJson } from '@/services/contentsJsonGenerator'
import {
  addPackToWhatsApp,
  addSubPackToWhatsApp,
  getPartCount,
  needsSplitting,
  prepareSubPacks
} from '@/services/packSplitter'
import type { SubPack } from '@/services/packSplitter'
import {
  isStickerPackWhitelisted,
  refreshContentProvider,
  validateStickerPack
} from '@/services/whatsappBridge'
import type { PackWithStickers } from '@/types'
import { Button, Icon, Text, useTheme } from 'react-native-paper'

export default function WhatsAppSection({ pack }: { pack: PackWithStickers }) {
  const t = useTheme()
  const [adding, setAdding] = useState(false)
  const [whitelisted, setWhitelisted] = useState(false)
  const [whitelistedParts, setWhitelistedParts] = useState<boolean[]>([])
  const pendingSubPacksRef = useRef<SubPack[]>([])

  const checkStatus = async () => {
    if (needsSplitting(pack.stickers.length)) {
      const partCount = getPartCount(pack.stickers.length)
      const results: boolean[] = []
      for (let i = 0; i < partCount; i++) {
        results.push(
          await isStickerPackWhitelisted(`${pack.identifier}_part${i + 1}`)
        )
      }
      setWhitelistedParts(results)
      setWhitelisted(results.every(Boolean))
    } else {
      const wl = await isStickerPackWhitelisted(pack.identifier)
      setWhitelisted(wl)
      setWhitelistedParts(wl ? [true] : [false])
    }
  }

  React.useEffect(() => {
    checkStatus()
  }, [])

  const handleAddToWhatsApp = async () => {
    if (needsSplitting(pack.stickers.length)) {
      Alert.alert(
        'Large Sticker Pack',
        `This pack has ${pack.stickers.length} stickers...`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => doSplitAdd() }
        ]
      )
    } else {
      await doDirectAdd()
    }
  }

  const doDirectAdd = async () => {
    setAdding(true)
    try {
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      Alert.alert(
        'Error',
        msg.includes('not installed') ? 'Please install WhatsApp.' : msg
      )
    }
    setAdding(false)
  }

  const doSplitAdd = async () => {
    setAdding(true)
    try {
      await regenerateContentsJson(pack.id)
      await refreshContentProvider()
      const subPacks = await prepareSubPacks(pack)
      pendingSubPacksRef.current = subPacks.slice(1)
      await addSubPackToWhatsApp(subPacks[0])
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed')
      pendingSubPacksRef.current = []
      setAdding(false)
    }
  }

  return (
    <View style={{ paddingBottom: 16, paddingHorizontal: 16 }}>
      {whitelisted ? (
        <View
          style={{
            backgroundColor: t.colors.elevation.level1,
            paddingVertical: 16,
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Icon source="check-circle" size={18} color={t.colors.primary} />
          <Text
            variant="titleSmall"
            style={{ color: t.colors.primary, marginLeft: 4 }}
          >
            {' '}
            Already Added to WhatsApp
            {whitelistedParts.length > 1
              ? ` (${whitelistedParts.length} parts)`
              : ''}
          </Text>
        </View>
      ) : whitelistedParts.some(Boolean) ? (
        <View style={{ gap: 8 }}>
          <View
            style={{
              backgroundColor: t.colors.elevation.level1,
              paddingVertical: 12,
              borderRadius: 12,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Icon
              source="check-circle-outline"
              size={18}
              color={t.colors.secondary}
            />
            <Text
              variant="titleSmall"
              style={{ color: t.colors.secondary, marginLeft: 4 }}
            >
              {' '}
              {whitelistedParts.filter(Boolean).length} of{' '}
              {whitelistedParts.length} parts added
            </Text>
          </View>
          <Button
            mode="contained"
            buttonColor={adding ? t.colors.surfaceDisabled : t.colors.primary}
            contentStyle={{ paddingVertical: 8 }}
            onPress={handleAddToWhatsApp}
            disabled={adding}
            icon="whatsapp"
          >
            {adding ? 'Opening WhatsApp...' : 'Add Remaining Parts'}
          </Button>
        </View>
      ) : (
        <Button
          mode="contained"
          buttonColor={adding ? t.colors.surfaceDisabled : t.colors.primary}
          onPress={handleAddToWhatsApp}
          disabled={adding}
          icon="whatsapp"
        >
          {adding ? 'Opening WhatsApp...' : 'Add to WhatsApp'}
        </Button>
      )}
    </View>
  )
}
