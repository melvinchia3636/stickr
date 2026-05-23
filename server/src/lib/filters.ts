export const SCALE_BASE =
  'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:-1:-1:color=0x00000000'

export function scaleFilter(fps: number): string {
  return `fps=${fps},${SCALE_BASE}`
}

export const TRAY_FILTER =
  'scale=96:96:force_original_aspect_ratio=decrease,format=rgba,pad=96:96:-1:-1:color=0x00000000'

export function paletteReduceFilter(colors: number): string {
  return `palettegen=max_colors=${colors}:stats_mode=diff,paletteuse=dither=bayer:bayer_scale=3`
}
