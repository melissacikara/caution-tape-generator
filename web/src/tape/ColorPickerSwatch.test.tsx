import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ColorPickerSwatch } from './ColorPickerSwatch'

describe('ColorPickerSwatch', () => {
  it('renders input[type=color] with DOM attribute matching value prop at mount', () => {
    render(<ColorPickerSwatch value="#FFD000" onChange={vi.fn()} />)
    const input = screen.getByLabelText('Tape color') as HTMLInputElement
    // .value (IDL property) is what the native OS picker reads at open-time;
    // useEffect imperatively sets this to keep it in sync with the value prop.
    expect(input.value).toBe('#ffd000')
  })

  it('updates DOM value when value prop changes (validates imperative sync)', () => {
    const { rerender } = render(<ColorPickerSwatch value="#FFD000" onChange={vi.fn()} />)
    const input = screen.getByLabelText('Tape color') as HTMLInputElement
    expect(input.value).toBe('#ffd000')

    rerender(<ColorPickerSwatch value="#FF0000" onChange={vi.fn()} />)
    // After rerender + useEffect flush, .value must reflect the new prop
    expect(input.value).toBe('#ff0000')
  })

  it('calls onChange with new hex when input fires a change event', () => {
    const handleChange = vi.fn()
    render(<ColorPickerSwatch value="#FFD000" onChange={handleChange} />)
    const input = screen.getByLabelText('Tape color') as HTMLInputElement

    fireEvent.change(input, { target: { value: '#123456' } })
    expect(handleChange).toHaveBeenCalledOnce()
    expect(handleChange).toHaveBeenCalledWith('#123456')
  })

  it('disables the input when disabled prop is true', () => {
    render(<ColorPickerSwatch value="#FFD000" onChange={vi.fn()} disabled />)
    const input = screen.getByLabelText('Tape color') as HTMLInputElement
    expect(input).toBeDisabled()
  })
})
