import { getPackWithStickers } from '@/database/packRepository';
import { writeContentsJson } from './stickerFileManager';

export async function regenerateContentsJson(packId: string): Promise<void> {
  const pack = await getPackWithStickers(packId);
  if (!pack) {
    throw new Error(`Pack not found: ${packId}`);
  }

  await writeContentsJson(
    pack.identifier,
    pack.name,
    pack.publisher || 'Sticker Creator',
    pack.trayImageFile,
    pack.stickers.map((s) => ({
      imageFileName: s.imageFileName,
      emojis: s.emojis,
    }))
  );
}
