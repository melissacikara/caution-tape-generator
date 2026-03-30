/** Story 2.8: tighten Access-Control-Allow-Origin to your Vercel domain in production. */
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, idempotency-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}
