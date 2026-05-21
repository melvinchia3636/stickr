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

export async function validateStickerPack(
  identifier: string
): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
  if (Platform.OS !== 'android')
    return { valid: true, errors: [], warnings: [] }
  const module = await checkModule()
  const result = await module.validateStickerPack(identifier)
  console.log(`[Validate] pack=${identifier} valid=${result.valid}`)
  if (result.errors.length > 0) {
    console.log(`[Validate] ERRORS:`)
    result.errors.forEach((e: string) => console.log(`  ❌ ${e}`))
  }
  if (result.warnings.length > 0) {
    console.log(`[Validate] WARNINGS:`)
    result.warnings.forEach((w: string) => console.log(`  ⚠️ ${w}`))
  }
  return result
}
