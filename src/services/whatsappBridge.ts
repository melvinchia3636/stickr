import { NativeModules, Platform } from 'react-native'

import type { StickerModuleNative } from '@/types'

const { StickerModule } = NativeModules

async function checkModule(): Promise<StickerModuleNative> {
  if (!StickerModule) {
    throw new Error('StickerModule is not available. Are you on Android?')
  }
  return StickerModule as StickerModuleNative
}

export async function addStickerPackToWhatsApp(
  identifier: string,
  packName: string
): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('WhatsApp stickers are only supported on Android')
  }
  const module = await checkModule()
  await module.addStickerPackToWhatsApp(identifier, packName)
}

export async function isStickerPackWhitelisted(
  identifier: string
): Promise<boolean> {
  if (Platform.OS !== 'android') return false
  try {
    const module = await checkModule()
    return await module.isStickerPackWhitelisted(identifier)
  } catch {
    return false
  }
}

export async function refreshContentProvider(): Promise<void> {
  if (Platform.OS !== 'android') return
  const module = await checkModule()
  await module.refreshContentProvider()
}
