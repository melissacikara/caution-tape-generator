/**
 * Accessibility tests for DeleteConfirmSheet (Story 4.4).
 * Covers: cancel button focused on open (AC #1) and Escape key closes sheet (AC #1).
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DeleteConfirmSheet } from './DeleteConfirmSheet'

const defaultProps = {
  open: true,
  title: 'Delete tape?',
  description: 'This action cannot be undone.',
  confirmLabel: 'Delete',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

describe('DeleteConfirmSheet — accessibility (Story 4.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('focuses the cancel button when sheet opens', () => {
    render(<DeleteConfirmSheet {...defaultProps} />)
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    expect(document.activeElement).toBe(cancelButton)
  })

  it('calls onCancel when Escape key is pressed', async () => {
    const user = userEvent.setup()
    render(<DeleteConfirmSheet {...defaultProps} />)
    await user.keyboard('{Escape}')
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('does not render when open is false', () => {
    render(<DeleteConfirmSheet {...defaultProps} open={false} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
