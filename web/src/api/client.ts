import type {
  AddTapeBody,
  AddTapeResponse,
  CreateScenarioBody,
  CreateScenarioResponse,
  DeleteScenarioBody,
  DeleteScenarioResponse,
  DeleteTapeBody,
  DeleteTapeResponse,
  FollowScenarioBody,
  FollowScenarioResponse,
  GetScenarioResponse,
  ListScenariosResponse,
  ListUnreadScenariosResponse,
  MarkScenarioReadBody,
  MarkScenarioReadResponse,
  ReportTapeBody,
  ReportTapeResponse,
  ToggleScenarioVisibilityBody,
  ToggleScenarioVisibilityResponse,
  UnfollowScenarioBody,
  UnfollowScenarioResponse,
  UpdateScenarioBody,
  UpdateScenarioResponse,
  UpdateTapeBody,
  UpdateTapeResponse,
} from './types'

import { supabaseClient } from '../lib/supabase'

export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  return Boolean(url && key)
}

function supabaseFunctionUrl(functionName: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') ?? ''
  return `${base}/functions/v1/${functionName}`
}

/** Fresh JWT for Edge Functions (same pattern for POST and GET). */
async function getBearerTokenForEdgeFunctions(): Promise<string> {
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
  await supabaseClient.auth.getUser()
  let { data: { session } } = await supabaseClient.auth.getSession()
  if (!session) {
    const { data } = await supabaseClient.auth.refreshSession()
    session = data.session ?? null
  }
  return session?.access_token ?? anon
}

async function supabaseFetch(path: string, init: RequestInit): Promise<Response> {
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
  const token = await getBearerTokenForEdgeFunctions()

  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('apikey', anon)
  return fetch(supabaseFunctionUrl(path), { ...init, headers })
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    throw new ApiError('PARSE_ERROR', 'Invalid JSON response', res.status)
  }
  if (!res.ok) {
    const err = (data as { error?: { code: string; message: string } })?.error
    throw new ApiError(
      err?.code ?? 'UNKNOWN',
      err?.message ?? res.statusText,
      res.status,
    )
  }
  return data as T
}

export async function createScenario(
  body: CreateScenarioBody,
): Promise<CreateScenarioResponse> {
  const res = await supabaseFetch('create-scenario', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseJson<CreateScenarioResponse>(res)
}

export async function getScenarioBySlug(slug: string): Promise<GetScenarioResponse> {
  const url = new URL(supabaseFunctionUrl('get-scenario-by-slug'))
  url.searchParams.set('slug', slug)
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
  const token = await getBearerTokenForEdgeFunctions()
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anon,
    },
  })
  return parseJson<GetScenarioResponse>(res)
}

export async function addTape(body: AddTapeBody): Promise<AddTapeResponse> {
  const res = await supabaseFetch('add-tape', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseJson<AddTapeResponse>(res)
}

export async function updateTape(body: UpdateTapeBody): Promise<UpdateTapeResponse> {
  const res = await supabaseFetch('update-tape', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseJson<UpdateTapeResponse>(res)
}

export async function deleteTape(body: DeleteTapeBody): Promise<DeleteTapeResponse> {
  const res = await supabaseFetch('delete-tape', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseJson<DeleteTapeResponse>(res)
}

export async function updateScenario(body: UpdateScenarioBody): Promise<UpdateScenarioResponse> {
  const res = await supabaseFetch('update-scenario', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseJson<UpdateScenarioResponse>(res)
}

export async function deleteScenario(body: DeleteScenarioBody): Promise<DeleteScenarioResponse> {
  const res = await supabaseFetch('delete-scenario', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseJson<DeleteScenarioResponse>(res)
}

export async function listScenarios(slugs: string[]): Promise<ListScenariosResponse> {
  const res = await supabaseFetch('list-scenarios', {
    method: 'POST',
    body: JSON.stringify({ slugs }),
  })
  return parseJson<ListScenariosResponse>(res)
}

export async function toggleScenarioVisibility(
  body: ToggleScenarioVisibilityBody,
): Promise<ToggleScenarioVisibilityResponse> {
  const res = await supabaseFetch('toggle-scenario-visibility', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseJson<ToggleScenarioVisibilityResponse>(res)
}

export async function reportTape(body: ReportTapeBody): Promise<ReportTapeResponse> {
  const res = await supabaseFetch('report-tape', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseJson<ReportTapeResponse>(res)
}

export async function listPublicScenarios(): Promise<ListScenariosResponse> {
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
  const token = await getBearerTokenForEdgeFunctions()
  const res = await fetch(supabaseFunctionUrl('list-public-scenarios'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anon,
    },
  })
  return parseJson<ListScenariosResponse>(res)
}

export async function listMyScenarios(): Promise<ListScenariosResponse> {
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
  const token = await getBearerTokenForEdgeFunctions()
  const res = await fetch(supabaseFunctionUrl('list-my-scenarios'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anon,
    },
  })
  return parseJson<ListScenariosResponse>(res)
}

export async function listInvitedScenarios(): Promise<ListScenariosResponse> {
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
  const token = await getBearerTokenForEdgeFunctions()
  const res = await fetch(supabaseFunctionUrl('list-invited-scenarios'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anon,
    },
  })
  return parseJson<ListScenariosResponse>(res)
}

export async function listFollowedScenarios(): Promise<ListScenariosResponse> {
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
  const token = await getBearerTokenForEdgeFunctions()
  const res = await fetch(supabaseFunctionUrl('list-followed-scenarios'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anon,
    },
  })
  return parseJson<ListScenariosResponse>(res)
}

export async function listUnreadScenarios(): Promise<ListUnreadScenariosResponse> {
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
  const token = await getBearerTokenForEdgeFunctions()
  const res = await fetch(supabaseFunctionUrl('list-unread-scenarios'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anon,
    },
  })
  return parseJson<ListUnreadScenariosResponse>(res)
}

export async function markScenarioRead(
  body: MarkScenarioReadBody,
): Promise<MarkScenarioReadResponse> {
  const res = await supabaseFetch('mark-scenario-read', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseJson<MarkScenarioReadResponse>(res)
}

export async function followScenario(body: FollowScenarioBody): Promise<FollowScenarioResponse> {
  const res = await supabaseFetch('follow-scenario', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseJson<FollowScenarioResponse>(res)
}

export async function unfollowScenario(
  body: UnfollowScenarioBody,
): Promise<UnfollowScenarioResponse> {
  const res = await supabaseFetch('unfollow-scenario', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseJson<UnfollowScenarioResponse>(res)
}
