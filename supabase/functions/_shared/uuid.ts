/** Compare UUID strings from Postgres/JS without false negatives from casing or hyphen layout. */
export function sameUuid(a: string, b: string): boolean {
  const norm = (s: string) => s.replace(/-/g, '').toLowerCase()
  return norm(a) === norm(b)
}
