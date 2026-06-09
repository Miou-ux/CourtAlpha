import type { AuthUser } from '../api/client'

const ADMIN_ROLES = new Set(['owner', 'admin'])

export function isAdmin(user: AuthUser | null | undefined): boolean {
  if (!user?.username) return false
  const role = (user.role || 'user').trim().toLowerCase()
  if (ADMIN_ROLES.has(role)) return true
  return user.username.trim().toLowerCase() === 'miouppy'
}

export function isPremium(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  if (isAdmin(user)) return true
  return !!user.premium_active
}

export function adminRoleLabel(user: AuthUser): string {
  const role = (user.role || 'user').trim().toLowerCase()
  if (role === 'owner') return 'Owner'
  if (role === 'admin') return 'Admin'
  return 'Admin'
}
