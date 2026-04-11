import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ColorPresetRow } from './ColorPresetRow'
import { TAPE_PRESETS } from './tapePresets'

describe('ColorPresetRow', () => {
  it('renders a button for each preset in TAPE_PRESETS', () => {
    render(<ColorPresetRow value="#FFD000" onChange={vi.fn()} />)
    TAPE_PRESETS.forEach((preset) => {
      expect(screen.getByRole('button', { name: preset.label })).toBeInTheDocument()
    })
  })

  it('renders a Custom button', () => {
    render(<ColorPresetRow value="#FFD000" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /custom/i })).toBeInTheDocument()
  })

  it('calls onChange with preset hex when a preset swatch is clicked', () => {
    const handleChange = vi.fn()
    render(<ColorPresetRow value="#FFD000" onChange={handleChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Safety Orange' }))
    expect(handleChange).toHaveBeenCalledOnce()
    expect(handleChange).toHaveBeenCalledWith('#FF6B00')
  })

  it('marks the swatch matching value as active, others are not active', () => {
    render(<ColorPresetRow value="#FF6B00" onChange={vi.fn()} />)
    const activeButton = screen.getByRole('button', { name: 'Safety Orange' })
    expect(activeButton).toHaveAttribute('aria-pressed', 'true')
    const inactiveButton = screen.getByRole('button', { name: 'Caution Yellow' })
    expect(inactiveButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('does not mark any preset active when value is a custom hex not in TAPE_PRESETS', () => {
    render(<ColorPresetRow value="#ABCDEF" onChange={vi.fn()} />)
    TAPE_PRESETS.forEach((preset) => {
      const button = screen.getByRole('button', { name: preset.label })
      expect(button).toHaveAttribute('aria-pressed', 'false')
    })
  })

  it('shows the custom color picker when Custom is clicked', () => {
    render(<ColorPresetRow value="#FFD000" onChange={vi.fn()} />)
    expect(screen.queryByLabelText(/tape color/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /custom/i }))
    expect(screen.getByLabelText(/tape color/i)).toBeInTheDocument()
  })

  it('collapses custom picker when Custom is clicked again (toggle)', () => {
    render(<ColorPresetRow value="#ABCDEF" onChange={vi.fn()} />)
    expect(screen.getByLabelText(/tape color/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /custom/i }))
    expect(screen.queryByLabelText(/tape color/i)).not.toBeInTheDocument()
  })

  it('collapses the custom color picker when a preset is selected', () => {
    render(<ColorPresetRow value="#ABCDEF" onChange={vi.fn()} />)
    expect(screen.getByLabelText(/tape color/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Caution Yellow' }))
    expect(screen.queryByLabelText(/tape color/i)).not.toBeInTheDocument()
  })

  it('starts with custom picker open when value does not match any preset', () => {
    render(<ColorPresetRow value="#ABCDEF" onChange={vi.fn()} />)
    expect(screen.getByLabelText(/tape color/i)).toBeInTheDocument()
  })

  it('syncs showCustom when value prop changes to a preset externally', () => {
    const { rerender } = render(<ColorPresetRow value="#ABCDEF" onChange={vi.fn()} />)
    expect(screen.getByLabelText(/tape color/i)).toBeInTheDocument()
    act(() => {
      rerender(<ColorPresetRow value="#FFD000" onChange={vi.fn()} />)
    })
    expect(screen.queryByLabelText(/tape color/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Caution Yellow' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('syncs showCustom when value prop changes to a non-preset externally', () => {
    const { rerender } = render(<ColorPresetRow value="#FFD000" onChange={vi.fn()} />)
    expect(screen.queryByLabelText(/tape color/i)).not.toBeInTheDocument()
    act(() => {
      rerender(<ColorPresetRow value="#ABCDEF" onChange={vi.fn()} />)
    })
    expect(screen.getByLabelText(/tape color/i)).toBeInTheDocument()
  })

  it('does not call onChange when a preset is clicked and disabled', () => {
    const handleChange = vi.fn()
    render(<ColorPresetRow value="#FFD000" onChange={handleChange} disabled />)
    fireEvent.click(screen.getByRole('button', { name: 'Safety Orange' }))
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('does not open custom picker when Custom is clicked and disabled', () => {
    render(<ColorPresetRow value="#FFD000" onChange={vi.fn()} disabled />)
    fireEvent.click(screen.getByRole('button', { name: /custom/i }))
    expect(screen.queryByLabelText(/tape color/i)).not.toBeInTheDocument()
  })
})
