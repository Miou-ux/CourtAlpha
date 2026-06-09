import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type PipelineStatus } from '../api/client'
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

function formatParis(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function pipelineTone(status: string): 'success' | 'accent' | 'default' {
  if (status === 'ok' || status === 'running') return status === 'running' ? 'accent' : 'success'
  if (status === 'warn') return 'accent'
  return 'default'
}

function PipelineRow({
  pipeline,
  onForce,
  forcing,
}: {
  pipeline: PipelineStatus
  onForce: (id: string) => void
  forcing: boolean
}) {
  return (
    <div className="border-b border-border/70 px-4 py-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{pipeline.label}</p>
            <Badge tone={pipelineTone(pipeline.status)}>{pipeline.running ? 'en cours' : pipeline.status}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted">
            Dernière MAJ : <span className="text-fg">{formatParis(pipeline.last_run_at)}</span>
          </p>
          {pipeline.last_run_detail && <p className="mt-0.5 text-xs text-muted">{pipeline.last_run_detail}</p>}
          <p className="mt-1 text-xs text-muted">
            Prochaine MAJ prévue : <span className="text-fg">{formatParis(pipeline.next_run_at)}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {pipeline.schedule_label} · {pipeline.schedule_driver}
          </p>
        </div>
        <button
          type="button"
          disabled={!pipeline.can_force || forcing || pipeline.running}
          onClick={() => onForce(pipeline.id)}
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pipeline.running || forcing ? 'Lancement…' : 'Forcer MAJ'}
        </button>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { user, token, logout } = useAuth()
  const qc = useQueryClient()
  const [forceJobId, setForceJobId] = useState<string | null>(null)

  const q = useQuery({
    queryKey: ['system-status', token],
    queryFn: () => api.systemStatus(token),
    enabled: isAdmin(user) && !!token,
    refetchInterval: (query) => {
      const pipelines = query.state.data?.pipelines ?? []
      return pipelines.some((p) => p.running) ? 5000 : 30000
    },
  })

  const runJob = useMutation({
    mutationFn: (jobId: string) => api.systemRunJob(token, jobId),
    onMutate: (jobId) => setForceJobId(jobId),
    onSettled: () => {
      setForceJobId(null)
      void qc.invalidateQueries({ queryKey: ['system-status', token] })
    },
  })

  const handleForce = (jobId: string) => {
    const label = q.data?.pipelines.find((p) => p.id === jobId)?.label ?? jobId
    if (!window.confirm(`Lancer maintenant : ${label} ?\n\nLe job s'exécute en arrière-plan sur le serveur.`)) return
    runJob.mutate(jobId)
  }

  const s = q.data

  return (
    <div>
      <PageHero
        kicker="Ops"
        title="Paramètres"
        subtitle="Pipelines données, état live et compte administrateur."
      />

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
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent/40"
            >
              Déconnexion
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Non connecté ·{' '}
            <a href="/login" className="text-accent hover:underline">
              Se connecter
            </a>
          </p>
        )}
      </div>

      {runJob.isError && (
        <p className="mb-4 text-sm text-red-400">{(runJob.error as Error).message}</p>
      )}
      {runJob.isSuccess && (
        <p className="mb-4 text-sm text-accent">Job lancé en arrière-plan — rafraîchissement automatique.</p>
      )}

      {q.isLoading ? (
        <p className="text-sm text-muted">Chargement statut…</p>
      ) : s ? (
        <div className="space-y-4">
          {s.pipelines?.length > 0 && (
            <div className="rounded-2xl border border-border bg-panel">
              <div className="border-b border-border/70 px-4 py-3">
                <p className="text-sm font-medium">Pipelines données</p>
                <p className="text-xs text-muted">Dernière exécution, prochaine MAJ planifiée et lancement manuel.</p>
              </div>
              {s.pipelines.map((p) => (
                <PipelineRow
                  key={p.id}
                  pipeline={p}
                  onForce={handleForce}
                  forcing={forceJobId === p.id && runJob.isPending}
                />
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-border bg-panel">
            <div className="border-b border-border/70 px-4 py-3">
              <p className="text-sm font-medium">État live</p>
            </div>
            <StatusRow
              label="Snapshot live"
              level={s.snapshot.level}
              detail={`${s.snapshot.n_matches} matchs · ${s.snapshot.age_min != null ? `${Math.round(s.snapshot.age_min)} min` : 'âge inconnu'}`}
            />
            <StatusRow
              label="Cotes prematch (TE)"
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
            <p className="mt-1">Vérifié : {formatParis(s.checked_at)}</p>
            <p className="mt-2 text-[11px] leading-relaxed">
              Les MAJ automatiques ML et sources (Sackmann/TML) tournent via le service Streamlit{' '}
              <code className="text-fg">bettinghud-dashboard</code>. Snapshot et scraper TE suivent aussi le daemon live
              et le cron matin (02h / 07h Paris).
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
