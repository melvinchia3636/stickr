const base64Lib = require('base-64')

function decodeBase64Old(base64) {
  const cleaned = base64.replace(/[^A-Za-z0-9+/]/g, '')
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
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

function decodeBase64New(input) {
  const binaryString = base64Lib.decode(input)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

// Generate test base64 (with padding, newlines, and carriage returns)
const rawStr = 'RIFF\x00\x00\x00\x00WEBPVP8X\x0a\x00\x00\x00\x02\x00'
const standardB64 = Buffer.from(rawStr, 'binary').toString('base64')
const formattedB64 = standardB64 + '\n\r ' // With whitespace and newlines

console.log('Testing standard base64...')
const oldBytes1 = decodeBase64Old(standardB64)
const newBytes1 = decodeBase64New(standardB64)
console.log('Old length:', oldBytes1.length, 'New length:', newBytes1.length)
console.log('Bytes match:', JSON.stringify(Array.from(oldBytes1)) === JSON.stringify(Array.from(newBytes1)))

console.log('\nTesting base64 with newlines/whitespace...')
try {
  const oldBytes2 = decodeBase64Old(formattedB64)
  const newBytes2 = decodeBase64New(formattedB64)
  console.log('Old length:', oldBytes2.length, 'New length:', newBytes2.length)
  console.log('Bytes match:', JSON.stringify(Array.from(oldBytes2)) === JSON.stringify(Array.from(newBytes2)))
} catch (e) {
  console.error('New decoder threw error:', e.message)
}
