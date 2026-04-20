/** Persists the Create flow across magic-link login (full page navigation). */

const STORAGE_KEY = 'caution-bmad:v1:create-flow-draft'

export type CreateFlowDraft = {
  warningText: string
  tapeColor: string
  lockedTape: { text: string; color: string } | null
  scenarioName: string
  tapeDestination: 'new' | 'existing'
  selectedSlug: string
}

const defaultDraft: CreateFlowDraft = {
  warningText: '',
  tapeColor: '#FFD000',
  lockedTape: null,
  scenarioName: '',
  tapeDestination: 'new',
  selectedSlug: '',
}

function safeParse(raw: string | null): Partial<CreateFlowDraft> | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as unknown
    if (typeof v !== 'object' || v === null) return null
    return v as Partial<CreateFlowDraft>
  } catch {
    return null
  }
}

export function loadCreateFlowDraft(): CreateFlowDraft {
  if (typeof sessionStorage === 'undefined') return { ...defaultDraft }
  const parsed = safeParse(sessionStorage.getItem(STORAGE_KEY))
  if (!parsed) return { ...defaultDraft }
  return {
    ...defaultDraft,
    ...parsed,
    lockedTape:
      parsed.lockedTape &&
      typeof parsed.lockedTape === 'object' &&
      typeof parsed.lockedTape.text === 'string' &&
      typeof parsed.lockedTape.color === 'string'
        ? { text: parsed.lockedTape.text, color: parsed.lockedTape.color }
        : null,
    tapeDestination: parsed.tapeDestination === 'existing' ? 'existing' : 'new',
  }
}

export function mergeCreateFlowDraft(updates: Partial<CreateFlowDraft>): void {
  if (typeof sessionStorage === 'undefined') return
  const next = { ...loadCreateFlowDraft(), ...updates }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* quota / private mode */
  }
}

export function clearCreateFlowDraft(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
