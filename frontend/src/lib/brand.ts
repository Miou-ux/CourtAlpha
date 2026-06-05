/** Charte CourtAlpha — alignée sur le logo (lime, teal, cyan, fond charcoal). */
export const BRAND = {
  lime: '#C8F135',
  teal: '#00D4C8',
  cyan: '#00D4FF',
  navy: '#1A2B48',
  bg: '#121212',
  panel: '#1E2128',
  border: '#2A3040',
  muted: '#8B93A7',
  atp: '#00D4C8',
  wta: '#7AE582',
  grid: '#2A3040',
  refLine: '#3D4A5C',
} as const

export const CHART_TOOLTIP_STYLE = {
  background: BRAND.panel,
  border: `1px solid ${BRAND.border}`,
  borderRadius: 12,
} as const
