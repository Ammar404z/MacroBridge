async function load(file: File): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = URL.createObjectURL(file)
  try {
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(img.src)
  }
}

function toBase64(canvas: HTMLCanvasElement, quality: number) {
  return canvas.toDataURL('image/jpeg', quality).split(',')[1]
}

/** Shrinks a photo to a JPEG at most 1280px wide/tall so uploads stay small. */
export async function toJpegBase64(file: File): Promise<string> {
  const img = await load(file)
  const scale = Math.min(1, 1280 / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  return toBase64(canvas, 0.85)
}

/** Centre square crop, 256 x 256 JPEG: a profile picture of ~15-30 KB. */
export async function toAvatarBase64(file: File): Promise<string> {
  const img = await load(file)
  const side = Math.min(img.width, img.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  canvas.getContext('2d')!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256)
  return toBase64(canvas, 0.85)
}
