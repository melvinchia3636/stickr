function decodeBase64(base64) {
  const cleaned = base64.replace(/[^A-Za-z0-9+/]/g, '')

  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

  const lookup = new Uint8Array(256)

  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i
  }
  let bufferLength = cleaned.length * 0.75

  if (cleaned[cleaned.length - 1] === '=') {
    bufferLength--

    if (cleaned[cleaned.length - 2] === '=') {
      bufferLength--
    }
  }

  const bytes = new Uint8Array(bufferLength)

  let p = 0

  for (let i = 0; i < cleaned.length; i += 4) {
    const base64x = lookup[cleaned.charCodeAt(i)]

    const base64y = lookup[cleaned.charCodeAt(i + 1)]

    const base64z = lookup[cleaned.charCodeAt(i + 2)]

    const base64w = lookup[cleaned.charCodeAt(i + 3)]

    bytes[p++] = (base64x << 2) | (base64y >> 4)
    if (p < bufferLength) bytes[p++] = ((base64y & 15) << 4) | (base64z >> 2)
    if (p < bufferLength) bytes[p++] = ((base64z & 3) << 6) | (base64w & 63)
  }

  return bytes
}

// Simple test with padding (22 bytes)
const testStr = 'RIFF\x00\x00\x00\x00WEBPVP8X\x0a\x00\x00\x00\x02\x00'
const base64 = Buffer.from(testStr, 'binary').toString('base64')
console.log('Original base64:', base64)
const decoded = decodeBase64(base64)
console.log(
  'Decoded binary string matches original:',
  Buffer.from(decoded).toString('binary') === testStr
)
console.log('Decoded size:', decoded.length, 'Original size:', testStr.length)
