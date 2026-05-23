import fs from 'fs'

export async function downloadFile(
  url: string,
  outputPath: string
): Promise<void> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `Failed to download file from ${url}: status ${response.status}`
    )
  }

  const buffer = await response.arrayBuffer()

  fs.writeFileSync(outputPath, Buffer.from(buffer))
}
