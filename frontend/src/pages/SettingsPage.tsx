import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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

function formatParis(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString(locale, { timeZone: 'Europe/Paris', dateStyle: 'short', timeStyle: 'short' })
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
  locale,
  t,
}: {
  pipeline: PipelineStatus
  onForce: (id: string) => void
  forcing: boolean
  locale: string
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  return (
    <div className="border-b border-border/70 px-4 py-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{pipeline.label}</p>
            <Badge tone={pipelineTone(pipeline.status)}>
              {pipeline.running ? t('settings.running') : pipeline.status}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted">
            {t('settings.lastUpdate')} :{' '}
            <span className="text-fg">{formatParis(pipeline.last_run_at, locale)}</span>
          </p>
          {pipeline.last_run_detail && <p className="mt-0.5 text-xs text-muted">{pipeline.last_run_detail}</p>}
          <p className="mt-1 text-xs text-muted">
            {t('settings.nextUpdate')} :{' '}
            <span className="text-fg">{formatParis(pipeline.next_run_at, locale)}</span>
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
          {pipeline.running || forcing ? t('settings.launching') : t('settings.forceUpdate')}
        </button>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith('en') ? 'en-GB' : 'fr-FR'
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
    if (!window.confirm(t('settings.confirmForce', { label }))) return
    runJob.mutate(jobId)
  }

  const s = q.data

  return (
    <div>
      <PageHero kicker={t('settings.kicker')} title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="mb-6 rounded-2xl border border-border bg-panel p-4">
        <p className="mb-2 text-sm font-medium">{t('settings.account')}</p>
        {user ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm">
              {user.display_name} <span className="text-muted">({user.username})</span>
            </span>
            {isAdmin(user) && <Badge tone="accent">{adminRoleLabel(user)}</Badge>}
            <Link to="/profile" className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent/40">
              {t('settings.myProfile')}
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent/40"
            >
              {t('nav.logout')}
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted">
            {t('settings.notSignedIn')} ·{' '}
            <a href="/login" className="text-accent hover:underline">
              {t('settings.signIn')}
            </a>
          </p>
        )}
      </div>

      {runJob.isError && <p className="mb-4 text-sm text-red-400">{(runJob.error as Error).message}</p>}
      {runJob.isSuccess && <p className="mb-4 text-sm text-accent">{t('settings.jobStarted')}</p>}

      {q.isLoading ? (
        <p className="text-sm text-muted">{t('settings.loadingStatus')}</p>
      ) : s ? (
        <div className="space-y-4">
          {s.pipelines?.length > 0 && (
            <div className="rounded-2xl border border-border bg-panel">
              <div className="border-b border-border/70 px-4 py-3">
                <p className="text-sm font-medium">{t('settings.dataPipelines')}</p>
                <p className="text-xs text-muted">{t('settings.pipelinesHint')}</p>
              </div>
              {s.pipelines.map((p) => (
                <PipelineRow
                  key={p.id}
                  pipeline={p}
                  onForce={handleForce}
                  forcing={forceJobId === p.id && runJob.isPending}
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-border bg-panel">
            <div className="border-b border-border/70 px-4 py-3">
              <p className="text-sm font-medium">{t('settings.liveState')}</p>
            </div>
            <StatusRow
              label={t('settings.snapshotLive')}
              level={s.snapshot.level}
              detail={t('settings.matchesAge', {
                count: s.snapshot.n_matches,
                age:
                  s.snapshot.age_min != null
                    ? `${Math.round(s.snapshot.age_min)} min`
                    : t('settings.unknownAge'),
              })}
            />
            <StatusRow
              label={t('settings.prematchOdds')}
              level={s.prematch_csv.level}
              detail={s.prematch_csv.file ?? t('settings.noCsv')}
            />
            <StatusRow
              label={t('settings.portfolioDaemon')}
              level={s.portfolio_daemon.level}
              detail={s.portfolio_daemon.active ? t('settings.active') : t('settings.inactive')}
            />
          </div>

          <div className="rounded-2xl border border-border bg-bg-elevated p-4 text-xs text-muted">
            <p>Root : {s.bettinghud_root}</p>
            <p className="mt-1">Env : {s.env}</p>
            <p className="mt-1">
              {t('settings.verified')} : {formatParis(s.checked_at, locale)}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed">{t('settings.footerNote')}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
