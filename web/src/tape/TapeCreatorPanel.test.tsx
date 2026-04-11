import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TapeCreatorPanel } from './TapeCreatorPanel'

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => ({ user: null, session: null, loading: false, signOut: vi.fn() }),
}))

vi.mock('../components/LoginModal', () => ({
  LoginModal: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Login">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

describe('TapeCreatorPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})
