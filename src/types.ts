export interface StickerPack {
  id: string
  name: string
  identifier: string
  publisher: string
  trayImageFile: string | null
  imageDataVersion: string
  createdAt: number
  updatedAt: number
}

export interface Sticker {
  id: string
  packId: string
  imageFileName: string
  emojis: string
  accessibilityText: string
  sortOrder: number
}

export interface PackWithStickers extends StickerPack {
  stickers: Sticker[]
}

export interface SigStickSearchResult {
  id: string
  title: string
  thumbnail: string
}

export interface ConvertResult {
  success: boolean
  width: number
  height: number
  size: number
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface StickerModuleNative {
  addStickerPackToWhatsApp(identifier: string, packName: string): Promise<void>
  isStickerPackWhitelisted(identifier: string): Promise<boolean>
  validateStickerPack(identifier: string): Promise<ValidationResult>
  refreshContentProvider(): Promise<void>
}

export interface ImageConverterModuleNative {
  convertToWebP(
    sourceUri: string,
    outputPath: string,
    maxDimension: number
  ): Promise<ConvertResult>
  generateTrayIcon(
    sourceUri: string,
    outputPath: string
  ): Promise<ConvertResult>
}

export type RootStackParamList = {
  Home: undefined
  CreatePack: undefined
  EditPack: { packId: string }
  SigStickSearch: undefined
  SigStickResult: { packId: string; packTitle: string; stickers: string[] }
  PackDetail: { packId: string }
}
