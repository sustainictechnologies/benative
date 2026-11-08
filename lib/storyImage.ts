// The tall picture (1080 × 1920) a homestay page shares to an Instagram Story: the homestay's photo,
// its name and place, and BeNative with the page's address at the bottom. It is drawn in the browser, so names in any script
// (Devanagari too) use the phone's own fonts. Instagram covers about 250 pixels at the top and bottom
// of a Story with its own buttons, so the text stays clear of those.

import { storyImgUrl } from '@/lib/supabase/imageUrl'

const W = 1080, H = 1920, SIDE = 80
const PHOTO_H = 1350                                  // 4:5, the shape of Instagram's tall photos
const GREEN = '#2d4520'                               // the BeNative logo's colour
const SERIF = "Georgia, 'Times New Roman', serif"     // as the BeNative name in the site's header

interface Story { photo: string | null; title: string; place: string; slug: string; address: string }

export async function makeStoryImage({ photo, title, place, slug, address }: Story): Promise<File> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no canvas')
  const sans = getComputedStyle(document.body).fontFamily   // the site's Inter
  await document.fonts?.ready

  ctx.fillStyle = GREEN
  ctx.fillRect(0, 0, W, H)

  const img = photo ? await loadPhoto(storyImgUrl(photo)) : null
  if (img) {
    // The photo fills the top part, cut to fit from the middle, and fades into the green behind the name
    const scale = Math.max(W / img.width, PHOTO_H / img.height)
    const w = img.width * scale, h = img.height * scale
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, W, PHOTO_H)
    ctx.clip()
    ctx.drawImage(img, (W - w) / 2, (PHOTO_H - h) / 2, w, h)
    ctx.restore()
    const fade = ctx.createLinearGradient(0, 860, 0, 1320)
    fade.addColorStop(0, 'rgba(45,69,32,0)')
    fade.addColorStop(1, GREEN)
    ctx.fillStyle = fade
    ctx.fillRect(0, 860, W, PHOTO_H - 860)
  } else {
    drawMark(ctx, W / 2 - 210, 380, 420, 'rgba(255,255,255,0.12)')   // no photo: a large, faint BeNative mark
  }

  // BeNative, at the bottom
  drawMark(ctx, SIDE, 1566, 72, '#ffffff')
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 46px ${SERIF}`
  ctx.fillText('BeNative', SIDE + 96, 1598)
  // The page's address, in smaller letters when it is long so it stays whole. It can't be tapped in a Story:
  // only Instagram's Link sticker can, and the page link is copied for that.
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  let size = 30
  do { ctx.font = `${size}px ${sans}` } while (ctx.measureText(address).width > W - 2 * SIDE - 96 && --size > 18)
  ctx.fillText(fit(ctx, address, W - 2 * SIDE - 96), SIDE + 96, 1638)
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.fillRect(SIDE, 1506, W - 2 * SIDE, 2)

  // The place, with a map pin
  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ctx.font = `500 38px ${sans}`
  drawPin(ctx, SIDE - 2, 1404, 42, 'rgba(255,255,255,0.88)')
  ctx.fillText(fit(ctx, place, W - 2 * SIDE - 54), SIDE + 54, 1440)

  // The name, up to three lines, just above the place
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 78px ${SERIF}`
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 16
  const lines = wrap(ctx, title.trim(), W - 2 * SIDE, 3)
  lines.forEach((line, i) => ctx.fillText(line, SIDE, 1352 - (lines.length - 1 - i) * 92))

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  if (!blob) throw new Error('picture not made')
  return new File([blob], `${slug}-benative-story.jpg`, { type: 'image/jpeg' })
}

// The photo, or null when it does not load in 10 seconds (the picture is then made without it)
async function loadPhoto(url: string): Promise<ImageBitmap | null> {
  const stop = new AbortController()
  const timer = setTimeout(() => stop.abort(), 10000)
  try {
    const res = await fetch(url, { signal: stop.signal })
    return res.ok ? await createImageBitmap(await res.blob()) : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// The BeNative mark (components/BeNativeLogo.tsx): a ring with a dot
function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const u = size / 100
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 6 * u
  ctx.beginPath()
  ctx.arc(x + 50 * u, y + 50 * u, 42 * u, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x + 72 * u, y + 62 * u, 10 * u, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// The map pin used on the homestay page (lucide's MapPin)
function drawPin(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / 24, size / 24)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke(new Path2D('M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0'))
  ctx.beginPath()
  ctx.arc(12, 10, 3, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

// The text cut short with "…" when it is wider than max
function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text
  let cut = text
  while (cut && ctx.measureText(cut + '…').width > max) cut = cut.slice(0, -1)
  return cut.trimEnd() + '…'
}

// The text split into lines no wider than max; past the last line it ends with "…"
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number, maxLines: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (!line || ctx.measureText(next).width <= max) line = next
    else { lines.push(line); line = word }
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines.map((l) => fit(ctx, l, max))
  const kept = lines.slice(0, maxLines)
  kept[maxLines - 1] = fit(ctx, `${kept[maxLines - 1]} ${lines[maxLines]}`, max)
  if (!kept[maxLines - 1].endsWith('…')) kept[maxLines - 1] += '…'
  return kept.map((l) => fit(ctx, l, max))
}
