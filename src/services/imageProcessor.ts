import { NativeModules } from 'react-native';
import { getStickerPath } from './stickerFileManager';
import type { ConvertResult } from '@/types';

const { ImageConverterModule } = NativeModules;

const STICKER_DIMENSION = 512;
const TRAY_FILE_NAME = 'tray_icon.png';

export async function convertToStickerWebP(
  sourceUri: string,
  identifier: string,
  fileName: string
): Promise<ConvertResult> {
  const outputPath = getStickerPath(identifier, fileName);
  return await ImageConverterModule.convertToWebP(sourceUri, outputPath, STICKER_DIMENSION);
}

export async function generateTrayIcon(
  sourceUri: string,
  identifier: string
): Promise<ConvertResult> {
  const outputPath = getStickerPath(identifier, TRAY_FILE_NAME);
  return await ImageConverterModule.generateTrayIcon(sourceUri, outputPath);
}

export { TRAY_FILE_NAME };
