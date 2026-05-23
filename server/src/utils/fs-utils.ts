import fs from 'fs'
import os from 'os'
import path from 'path'

export async function withTempDir<T>(
  prefix: string,
  fn: (dir: string) => Promise<T>
): Promise<T> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))

  try {
    return await fn(tempDir)
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

export function getTempFilePath(extension: string): string {
  const randomName = Math.random().toString(36).substring(2, 15)

  return path.join(os.tmpdir(), `${randomName}${extension}`)
}
