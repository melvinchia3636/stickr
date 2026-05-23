import React from 'react'

import { View } from 'react-native'

import WhatsAppAlreadyAddedStatus from '@/components/WhatsAppAlreadyAddedStatus'
import WhatsAppNotAddedStatus from '@/components/WhatsAppNotAddedStatus'
import WhatsAppPartialAddedStatus from '@/components/WhatsAppPartialAddedStatus'
import { useWhatsAppImport } from '@/hooks/useWhatsAppImport'
import type { PackWithStickers } from '@/types'

export default function WhatsAppSection({ pack }: { pack: PackWithStickers }) {
  const { adding, whitelisted, whitelistedParts, handleAddToWhatsApp } =
    useWhatsAppImport(pack)

  return (
    <View style={{ paddingBottom: 16, paddingHorizontal: 16 }}>
      {whitelisted ? (
        <WhatsAppAlreadyAddedStatus partsCount={whitelistedParts.length} />
      ) : whitelistedParts.some(Boolean) ? (
        <WhatsAppPartialAddedStatus
          addedCount={whitelistedParts.filter(Boolean).length}
          adding={adding}
          totalCount={whitelistedParts.length}
          onPress={handleAddToWhatsApp}
        />
      ) : (
        <WhatsAppNotAddedStatus adding={adding} onPress={handleAddToWhatsApp} />
      )}
    </View>
  )
}
