export type ScenarioDto = {
  id: string
  name: string
  publicSlug: string
  createdAt: string
  updatedAt?: string
}

export type TapeDto = {
  id: string
  scenarioId: string
  tapeText: string
  color: string
  createdAt: string
  updatedAt?: string
}

export type CreateScenarioBody = {
  name: string
  firstTape?: { tapeText: string; color: string }
}

export type CreateScenarioResponse = {
  scenario: ScenarioDto
  tapes: TapeDto[]
}

export type GetScenarioResponse = {
  scenario: ScenarioDto
  tapes: TapeDto[]
}

export type AddTapeBody = {
  scenarioSlug: string
  tapeText: string
  color: string
  idempotencyKey?: string
}

export type AddTapeResponse = {
  tape: TapeDto
  idempotent: boolean
}

export type UpdateTapeBody = {
  scenarioSlug: string
  tapeId: string
  tapeText: string
  color: string
}

export type UpdateTapeResponse = {
  tape: TapeDto
}

export type DeleteTapeBody = {
  scenarioSlug: string
  tapeId: string
}

export type DeleteTapeResponse = {
  ok: boolean
}

export type ScenarioSummaryItem = {
  scenario: ScenarioDto
  tapeCount: number
}

export type ListScenariosResponse = {
  scenarios: ScenarioSummaryItem[]
}
