import RNFS from 'react-native-fs';
import type { PackWithStickers, Sticker } from '@/types';
import {
  getPackDir,
  getStickerPath,
  ensurePackDir,
  writeContentsJson,
} from './stickerFileManager';
import { refreshContentProvider, addStickerPackToWhatsApp } from './whatsappBridge';
import { generateTrayIcon, TRAY_FILE_NAME } from './imageProcessor';

const MAX_STICKERS_PER_PACK = 30;
const TAG = '[PackSplitter]';

export interface SubPack {
  identifier: string;
  label: string;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function getSubPackIdentifier(parentIdentifier: string, partIndex: number): string {
  return `${parentIdentifier}_part${partIndex + 1}`;
}

async function createSubPack(
  pack: PackWithStickers,
  stickers: Sticker[],
  partIndex: number,
  totalParts: number
): Promise<SubPack> {
  const subId = getSubPackIdentifier(pack.identifier, partIndex);
  console.log(`${TAG} createSubPack() part ${partIndex + 1}/${totalParts} subId=${subId} stickers=${stickers.length}`);
  await ensurePackDir(subId);

  const traySource = getStickerPath(pack.identifier, pack.trayImageFile || TRAY_FILE_NAME);
  const trayDest = getStickerPath(subId, TRAY_FILE_NAME);
  const trayExists = await RNFS.exists(traySource);
  console.log(`${TAG}   traySource=${traySource} exists=${trayExists}`);

  if (trayExists) {
    await RNFS.copyFile(traySource, trayDest);
    const stat = await RNFS.stat(trayDest);
    console.log(`${TAG}   tray copied: ${stat.size} bytes`);
  } else {
    const firstStickerSrc = getStickerPath(pack.identifier, stickers[0].imageFileName);
    console.log(`${TAG}   generating tray from first sticker: ${firstStickerSrc}`);
    await generateTrayIcon(`file://${firstStickerSrc}`, subId);
  }

  for (const sticker of stickers) {
    const src = getStickerPath(pack.identifier, sticker.imageFileName);
    const dest = getStickerPath(subId, sticker.imageFileName);
    await RNFS.copyFile(src, dest);
  }
  console.log(`${TAG}   copied ${stickers.length} sticker files`);

  const partLabel = `${pack.name} (${partIndex + 1}/${totalParts})`;
  await writeContentsJson(
    subId,
    partLabel,
    pack.publisher || 'Sticker Creator',
    TRAY_FILE_NAME,
    stickers.map((s) => ({
      imageFileName: s.imageFileName,
      emojis: s.emojis,
    }))
  );
  console.log(`${TAG}   contents.json written for "${partLabel}"`);

  const subDir = getPackDir(subId);
  const files = await RNFS.readDir(subDir);
  console.log(`${TAG}   subPack dir files: ${files.map(f => `${f.name}(${f.size})`).join(', ')}`);

  return { identifier: subId, label: partLabel };
}

export async function prepareSubPacks(pack: PackWithStickers): Promise<SubPack[]> {
  console.log(`${TAG} prepareSubPacks() identifier=${pack.identifier} totalStickers=${pack.stickers.length}`);

  const stickersBaseDir = `${RNFS.DocumentDirectoryPath}/stickers`;
  const allDirs = await RNFS.readDir(stickersBaseDir);
  for (const dir of allDirs) {
    if (!dir.isDirectory()) continue;
    if (dir.name.includes('_part')) {
      console.log(`${TAG}   cleaning up stale sub-pack: ${dir.name}`);
      await RNFS.unlink(dir.path);
    } else {
      const contentsPath = `${dir.path}/contents.json`;
      if (await RNFS.exists(contentsPath)) {
        try {
          const raw = await RNFS.readFile(contentsPath, 'utf8');
          const parsed = JSON.parse(raw);
          const trayFile = parsed.sticker_packs?.[0]?.tray_image_file;
          if (trayFile) {
            const trayPath = `${dir.path}/${trayFile}`;
            if (!(await RNFS.exists(trayPath))) {
              console.log(`${TAG}   removing broken contents.json (missing tray ${trayFile}) in: ${dir.name}`);
              await RNFS.unlink(contentsPath);
            }
          }
        } catch {
          console.log(`${TAG}   removing corrupt contents.json in: ${dir.name}`);
          await RNFS.unlink(contentsPath);
        }
      }
    }
  }

  const chunks = chunkArray(pack.stickers, MAX_STICKERS_PER_PACK);
  console.log(`${TAG}   splitting into ${chunks.length} chunks: ${chunks.map(c => c.length).join(', ')}`);
  const subPacks: SubPack[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const subPack = await createSubPack(pack, chunks[i], i, chunks.length);
    subPacks.push(subPack);
  }

  const parentContentsJson = `${getPackDir(pack.identifier)}/contents.json`;
  const parentExists = await RNFS.exists(parentContentsJson);
  console.log(`${TAG}   parent contents.json exists=${parentExists}, removing...`);
  if (parentExists) {
    await RNFS.unlink(parentContentsJson);
  }

  console.log(`${TAG}   refreshing ContentProvider...`);
  await refreshContentProvider();
  console.log(`${TAG}   prepareSubPacks() done, ${subPacks.length} sub-packs ready`);
  return subPacks;
}

export async function addSubPackToWhatsApp(subPack: SubPack): Promise<void> {
  console.log(`${TAG} addSubPackToWhatsApp() identifier=${subPack.identifier} label="${subPack.label}"`);
  await addStickerPackToWhatsApp(subPack.identifier, subPack.label);
  console.log(`${TAG} addSubPackToWhatsApp() intent sent`);
}

export async function addPackToWhatsApp(pack: PackWithStickers): Promise<void> {
  console.log(`${TAG} addPackToWhatsApp() stickers=${pack.stickers.length} needsSplit=${pack.stickers.length > MAX_STICKERS_PER_PACK}`);
  if (pack.stickers.length <= MAX_STICKERS_PER_PACK) {
    console.log(`${TAG}   direct add: identifier=${pack.identifier}`);
    await addStickerPackToWhatsApp(pack.identifier, pack.name);
    return;
  }

  const subPacks = await prepareSubPacks(pack);
  console.log(`${TAG}   sending first sub-pack to WhatsApp...`);
  await addSubPackToWhatsApp(subPacks[0]);
}

export function needsSplitting(stickerCount: number): boolean {
  return stickerCount > MAX_STICKERS_PER_PACK;
}

export function getPartCount(stickerCount: number): number {
  return Math.ceil(stickerCount / MAX_STICKERS_PER_PACK);
}
