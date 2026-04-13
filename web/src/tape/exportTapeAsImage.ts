export type TapeExportInput = { text: string; color: string }

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim().replace(/^#/, '')
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    }
  }
  if (h.length === 6) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    }
  }
  return null
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function mixTowardBlack(hex: string, amount: number): string {
  const p = parseHex(hex)
  if (!p) return '#333333'
  const r = Math.round(p.r * (1 - amount))
  const g = Math.round(p.g * (1 - amount))
  const b = Math.round(p.b * (1 - amount))
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

function inkForTapeBackground(bgHex: string): string {
  const p = parseHex(bgHex)
  if (!p) return '#111111'
  const L = relativeLuminance(p.r, p.g, p.b)
  return L > 0.55 ? '#111111' : '#f0f0f0'
}

function normalizeHex(color: string): string {
  const t = color.trim()
  return t.startsWith('#') ? t : `#${t}`
}

export async function exportTapeAsImage(tape: TapeExportInput): Promise<void> {
  const baseHex = normalizeHex(tape.color)
  const stripeA = baseHex
  const stripeB = mixTowardBlack(baseHex, 0.38)
  const ink = inkForTapeBackground(baseHex)

  const upper = tape.text.trim().toUpperCase()
  const segment = `CAUTION: ${upper} ⚠ `
  const repeats = Math.min(64, Math.max(18, 14 + upper.length * 3))

  const fontSize = 20
  const paddingX = 12
  const paddingY = 12

  await document.fonts?.ready

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  ctx.font = `${fontSize}px "Bebas Neue", system-ui, sans-serif`
  const segmentWidth = ctx.measureText(segment).width
  const totalWidth = segmentWidth * repeats + paddingX * 2
  const totalHeight = fontSize + paddingY * 2
  canvas.width = Math.ceil(totalWidth)
  canvas.height = Math.ceil(totalHeight)

  // Fill background stripes
  const pitch = 22
  const w = canvas.width
  const h = canvas.height

  ctx.fillStyle = stripeA
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = stripeB
  for (let i = -(h + w); i < w + h; i += pitch) {
    ctx.save()
    ctx.translate(i, 0)
    ctx.rotate((-45 * Math.PI) / 180)
    ctx.fillRect(0, -h, 11, h * 3)
    ctx.restore()
  }

  // Draw repeating text
  ctx.fillStyle = ink
  ctx.font = `${fontSize}px "Bebas Neue", system-ui, sans-serif`
  ctx.textBaseline = 'top'
  let x = paddingX
  for (let i = 0; i < repeats; i++) {
    ctx.fillText(segment, x, paddingY)
    x += ctx.measureText(segment).width
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b)
      else reject(new Error('Canvas export failed'))
    }, 'image/png')
  })

  const file = new File([blob], 'caution-tape.png', { type: 'image/png' })

  const isMobile = navigator.maxTouchPoints > 0 || /Mobi/i.test(navigator.userAgent)
  if (
    isMobile &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] }) &&
    typeof navigator.share === 'function'
  ) {
    await navigator.share({ files: [file], title: 'Caution Tape' })
  } else {
    const url = URL.createObjectURL(blob)
    try {
      const a = document.createElement('a')
      a.href = url
      a.download = 'caution-tape.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}
