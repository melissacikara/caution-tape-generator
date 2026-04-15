/**
 * Accessibility tests for LoginModal (Story 4.4).
 * Covers: focus-on-open, focus-after-sent-transition, and Escape key (AC #1).
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const signInWithOtp = vi.hoisted(() => vi.fn())

// Prevent supabaseClient from making real network calls
vi.mock('../lib/supabase', () => ({
  supabaseClient: {
    auth: { signInWithOtp },
  },
}))

import { LoginModal } from './LoginModal'

describe('LoginModal — accessibility (Story 4.4)', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('focuses the email input on mount', () => {
    render(<LoginModal onClose={onClose} />)
    const emailInput = screen.getByRole('textbox', { name: /email address/i })
    expect(document.activeElement).toBe(emailInput)
  })

  it('calls onClose when Escape key is pressed', async () => {
    const user = userEvent.setup()
    render(<LoginModal onClose={onClose} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('focuses the resend control after successful magic link send', async () => {
    signInWithOtp.mockResolvedValue({ data: {}, error: null })
    const user = userEvent.setup()
    render(<LoginModal onClose={onClose} />)

    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'a@b.com')
    await user.click(screen.getByRole('button', { name: /email me a sign-in link/i }))

    const resend = await screen.findByRole('button', { name: /resend link/i })
    await waitFor(() => expect(document.activeElement).toBe(resend))
  })
})
