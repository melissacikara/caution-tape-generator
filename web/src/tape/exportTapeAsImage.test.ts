import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportTapeAsImage } from './exportTapeAsImage'

// Stub canvas context
const stubCtx = {
  font: '',
  fillStyle: '',
  textBaseline: '' as CanvasTextBaseline,
  measureText: vi.fn((text: string) => ({ width: text.length * 10 }) as TextMetrics),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
}

describe('exportTapeAsImage', () => {
  let getContextSpy: ReturnType<typeof vi.spyOn>
  let toBlobSpy: ReturnType<typeof vi.spyOn>
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock document.fonts.ready — jsdom may not implement this
    if (!document.fonts) {
      Object.defineProperty(document, 'fonts', {
        value: { ready: Promise.resolve() },
        configurable: true,
      })
    } else {
      vi.spyOn(document.fonts, 'ready', 'get').mockReturnValue(
        Promise.resolve(document.fonts),
      )
    }

    getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(stubCtx as unknown as CanvasRenderingContext2D)

    toBlobSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((cb) => cb(new Blob(['png'], { type: 'image/png' })))

    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    // Ensure navigator.canShare is not defined by default
    Object.defineProperty(navigator, 'canShare', {
      value: undefined,
      configurable: true,
      writable: true,
    })
  })

  afterEach(() => {
    getContextSpy.mockRestore()
    toBlobSpy.mockRestore()
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
  })

  it('does not throw when called with a valid tape', async () => {
    await expect(exportTapeAsImage({ text: 'test', color: '#FFD000' })).resolves.toBeUndefined()
  })

  it('canvas width grows with text length', async () => {
    const widths: number[] = []

    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      cb,
    ) {
      widths.push(this.width)
      cb(new Blob(['png'], { type: 'image/png' }))
    })

    await exportTapeAsImage({ text: 'hi', color: '#FFD000' })
    const shortWidth = widths[0]!

    await exportTapeAsImage({ text: 'a'.repeat(200), color: '#FFD000' })
    const longWidth = widths[1]!

    expect(longWidth).toBeGreaterThan(shortWidth)
  })

  it('calls navigator.share when on mobile with canShare support', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 1,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn().mockReturnValue(true),
      configurable: true,
      writable: true,
    })
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      configurable: true,
      writable: true,
    })

    await exportTapeAsImage({ text: 'share this', color: '#FF0000' })

    expect(mockShare).toHaveBeenCalledOnce()
    const callArgs = mockShare.mock.calls[0]![0] as { files: File[]; title: string }
    expect(callArgs.title).toBe('Caution Tape')
    expect(callArgs.files[0]).toBeInstanceOf(File)
    expect(callArgs.files[0]!.name).toBe('caution-tape.png')

    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true, writable: true })
  })

  it('uses <a download> fallback on desktop even when canShare is available', async () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true, writable: true })
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn().mockReturnValue(true),
      configurable: true,
      writable: true,
    })

    const clickSpy = vi.fn()
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((el) => {
      if (el instanceof HTMLAnchorElement) {
        Object.defineProperty(el, 'click', { value: clickSpy })
      }
      return el
    })
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((el) => el)

    await exportTapeAsImage({ text: 'desktop save', color: '#FFD000' })

    expect(createObjectURLSpy).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(revokeObjectURLSpy).toHaveBeenCalledOnce()

    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })

  it('uses <a download> fallback when navigator.share is not available', async () => {
    Object.defineProperty(navigator, 'canShare', {
      value: undefined,
      configurable: true,
      writable: true,
    })

    const clickSpy = vi.fn()
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((el) => {
      if (el instanceof HTMLAnchorElement) {
        Object.defineProperty(el, 'click', { value: clickSpy })
      }
      return el
    })
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((el) => el)

    await exportTapeAsImage({ text: 'download this', color: '#0000FF' })

    expect(createObjectURLSpy).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(revokeObjectURLSpy).toHaveBeenCalledOnce()

    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })
})
