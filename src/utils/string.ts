export function deepDecodeURIComponent(str: string): string {
  let current = str

  while (true) {
    try {
      const decoded = decodeURIComponent(current)

      if (decoded === current) {
        break
      }
      current = decoded
    } catch {
      break
    }
  }

  return current
}
