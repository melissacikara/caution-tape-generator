export type TapePreset = {
  hex: string
  label: string
}

export const TAPE_PRESETS: TapePreset[] = [
  { hex: '#FFD000', label: 'Caution Yellow' },
  { hex: '#FF6B00', label: 'Safety Orange' },
  { hex: '#CC0000', label: 'Hazard Red' },
  { hex: '#00AA44', label: 'Hi-Vis Green' },
  { hex: '#FFFFFF', label: 'Tape White' },
  { hex: '#111111', label: 'Void Black' },
  { hex: '#B5C400', label: 'Bile Yellow' },
  { hex: '#CC00AA', label: 'Cursed Magenta' },
  { hex: '#8B7355', label: 'Bureaucratic Beige' },
  { hex: '#4A0080', label: 'Regulatory Purple' },
]
