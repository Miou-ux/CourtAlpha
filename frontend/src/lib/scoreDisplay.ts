/** Format TE cache « 7 6 | 62 2 » → « 7-6, 6-2 » */
function expandSideTokens(tokens: string[]): number[] {
  const out: number[] = []
  for (const tok of tokens) {
    const t = tok.trim()
    if (!/^\d+$/.test(t)) continue
    if (t.length === 2) {
      const a = Number(t[0])
      const b = Number(t[1])
      if (a <= 7 && b <= 7) {
        out.push(a, b)
        continue
      }
    }
    out.push(Number(t))
  }
  return out
}

export function formatTennisScoreDisplay(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const s = raw.trim()
  if (!s) return null
  if (!s.includes('|')) return s

  const [left, right] = s.split('|', 2)
  const g1 = expandSideTokens(left.trim().split(/\s+/))
  const g2 = expandSideTokens(right.trim().split(/\s+/))
  if (g1.length === 0 && g2.length === 0) return s
  if (g1.length > 0 && g2.length > 0) {
    const n = Math.min(g1.length, g2.length)
    return Array.from({ length: n }, (_, i) => `${g1[i]}-${g2[i]}`).join(', ')
  }
  const side = g1.length > 0 ? g1 : g2
  return side.join(' ')
}
