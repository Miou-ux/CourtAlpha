import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Badge } from '../components/Badge'
import { PageHero } from '../components/PageHero'
import { adminRoleLabel, isAdmin } from '../lib/auth'
import { useAuth } from '../context/AuthContext'

function StatusRow({ label, level, detail }: { label: string; level: string; detail?: string }) {
  const tone = level === 'ok' ? 'success' : level === 'warn' ? 'accent' : 'default'
  return (
    <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {detail && <p className="text-xs text-muted">{detail}</p>}
      </div>
      <Badge tone={tone}>{level}</Badge>
    </div>
  )
}

export function SettingsPage() {
  const { user, token, logout } = useAuth()
  const q = useQuery({ queryKey: ['system-status', token], queryFn: () => api.systemStatus(token), enabled: isAdmin(user) })
  const s = q.data

  return (
    <div>
      <PageHero kicker="Ops" title="Paramètres" subtitle="État système PREPROD · compte web." />

      <div className="mb-6 rounded-2xl border border-border bg-panel p-4">
        <p className="mb-2 text-sm font-medium">Compte</p>
        {user ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm">
              {user.display_name} <span className="text-muted">({user.username})</span>
            </span>
            {isAdmin(user) && <Badge tone="accent">{adminRoleLabel(user)}</Badge>}
            <Link to="/profile" className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent/40">
              Mon profil
            </Link>
            <button type="button" onClick={() => void logout()} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent/40">
              Déconnexion
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Non connecté · <a href="/login" className="text-accent hover:underline">Se connecter</a>
          </p>
        )}
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted">Chargement statut…</p>
      ) : s ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-panel">
            <StatusRow
              label="Snapshot live"
              level={s.snapshot.level}
              detail={`${s.snapshot.n_matches} matchs · ${s.snapshot.age_min != null ? `${Math.round(s.snapshot.age_min)} min` : 'âge inconnu'}`}
            />
            <StatusRow
              label="Cotes prematch"
              level={s.prematch_csv.level}
              detail={s.prematch_csv.file ?? 'aucun CSV'}
            />
            <StatusRow
              label="Daemon portfolio"
              level={s.portfolio_daemon.level}
              detail={s.portfolio_daemon.active ? 'actif' : 'inactif'}
            />
          </div>
          <div className="rounded-2xl border border-border bg-bg-elevated p-4 text-xs text-muted">
            <p>Root : {s.bettinghud_root}</p>
            <p className="mt-1">Env : {s.env}</p>
            {typeof s.data_freshness?.last_tours_sync_iso === 'string' && (
              <p className="mt-1">Dernier sync tours : {s.data_freshness.last_tours_sync_iso}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
