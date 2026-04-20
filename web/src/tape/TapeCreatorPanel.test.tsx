import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TapeCreatorPanel } from './TapeCreatorPanel'

vi.mock('../providers/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1' }, session: null, loading: false, signOut: vi.fn() }),
}))

vi.mock('../components/LoginModal', () => ({
  LoginModal: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Login">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

vi.mock('./exportTapeAsImage', () => ({
  exportTapeAsImage: vi.fn().mockResolvedValue(undefined),
}))

// Import after mocking so we get the mock reference
import { exportTapeAsImage } from './exportTapeAsImage'
const mockExportTapeAsImage = vi.mocked(exportTapeAsImage)

describe('TapeCreatorPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('enforces maxLength={2000} on the warning text input', () => {
    render(<TapeCreatorPanel />)
    const input = screen.getByLabelText('Caution tape warning text') as HTMLInputElement
    expect(input.maxLength).toBe(2000)
  })

  it('renders the warning text input', () => {
    render(<TapeCreatorPanel />)
    expect(screen.getByLabelText('Caution tape warning text')).toBeInTheDocument()
  })

  it('does NOT show the Save tape button when tape is not locked', () => {
    render(<TapeCreatorPanel />)
    expect(screen.queryByRole('button', { name: /save tape/i })).not.toBeInTheDocument()
  })

  it('shows the Save tape button when tape is locked', async () => {
    const user = userEvent.setup()
    render(<TapeCreatorPanel />)

    await user.type(screen.getByLabelText('Caution tape warning text'), 'danger')
    await user.click(screen.getByRole('button', { name: /issue a warning/i }))

    expect(screen.getByRole('button', { name: /save tape/i })).toBeInTheDocument()
  })

  it('calls exportTapeAsImage when the Save tape button is clicked', async () => {
    const user = userEvent.setup()
    render(<TapeCreatorPanel />)

    await user.type(screen.getByLabelText('Caution tape warning text'), 'danger')
    await user.click(screen.getByRole('button', { name: /issue a warning/i }))
    await user.click(screen.getByRole('button', { name: /save tape/i }))

    expect(mockExportTapeAsImage).toHaveBeenCalledOnce()
    expect(mockExportTapeAsImage).toHaveBeenCalledWith({ text: 'danger', color: '#FFD000' })
  })

  it('shows an inline error message when export fails', async () => {
    mockExportTapeAsImage.mockRejectedValueOnce(new Error('Canvas export failed'))

    const user = userEvent.setup()
    render(<TapeCreatorPanel />)

    await user.type(screen.getByLabelText('Caution tape warning text'), 'danger')
    await user.click(screen.getByRole('button', { name: /issue a warning/i }))
    await user.click(screen.getByRole('button', { name: /save tape/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Canvas export failed')
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /save tape/i })).not.toBeInTheDocument()
  })

  it('does not show an error when export is cancelled (AbortError)', async () => {
    const abortError = new DOMException('Share cancelled', 'AbortError')
    mockExportTapeAsImage.mockRejectedValueOnce(abortError)

    const user = userEvent.setup()
    render(<TapeCreatorPanel />)

    await user.type(screen.getByLabelText('Caution tape warning text'), 'danger')
    await user.click(screen.getByRole('button', { name: /issue a warning/i }))
    await user.click(screen.getByRole('button', { name: /save tape/i }))

    await new Promise((r) => setTimeout(r, 0))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save tape/i })).toBeInTheDocument()
  })

  it('clears the export error when Reset is clicked', async () => {
    mockExportTapeAsImage.mockRejectedValueOnce(new Error('Canvas export failed'))

    const user = userEvent.setup()
    render(<TapeCreatorPanel />)

    await user.type(screen.getByLabelText('Caution tape warning text'), 'danger')
    await user.click(screen.getByRole('button', { name: /issue a warning/i }))
    await user.click(screen.getByRole('button', { name: /save tape/i }))

    await screen.findByRole('alert')

    await user.click(screen.getByRole('button', { name: /reset/i }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
