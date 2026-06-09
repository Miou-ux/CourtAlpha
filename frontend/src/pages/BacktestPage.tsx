import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, type BacktestSimulateRequest } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHero } from '../components/PageHero'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { FieldLabel, Input, Select } from '../components/ui/input'
import { StatTile } from '../components/ui/stat-tile'
import { BRAND, CHART_TOOLTIP_STYLE } from '../lib/brand'
import { useAuth } from '../context/AuthContext'

export function BacktestPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const yearsQ = useQuery({ queryKey: ['backtest-years', token], queryFn: () => api.backtestYears(token) })
  const years = yearsQ.data?.years ?? []
  const [year, setYear] = useState<number | ''>('')
  const [bankroll, setBankroll] = useState(1000)
  const [kelly, setKelly] = useState(0.5)
  const [cap, setCap] = useState(5)

  const sim = useMutation({
    mutationFn: (body: BacktestSimulateRequest) => api.backtestSimulate(body, token),
  })

  const selectedYear = year === '' ? (years[years.length - 1] ?? null) : year
  const history = sim.data?.history ?? []
  const summary = sim.data?.summary

  return (
    <div>
      <PageHero
        kicker={t('backtest.kicker')}
        title={t('backtest.title')}
        subtitle={t('backtest.subtitle')}
        stats={
          summary
            ? [
                { label: t('backtest.bets'), value: String(summary.n_bets) },
                { label: t('backtest.finalBr'), value: `${summary.bankroll_final.toFixed(0)} €` },
              ]
            : undefined
        }
      />

      <Card variant="default" className="mb-6 p-4">
        <form
          className="grid gap-4 md:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (selectedYear == null) return
            sim.mutate({
              year: selectedYear,
              bankroll_start: bankroll,
              kelly_multiplier: kelly,
              max_stake_pct: cap,
            })
          }}
        >
          <label className="text-sm">
            <FieldLabel>{t('backtest.year')}</FieldLabel>
            <Select value={selectedYear ?? ''} onChange={(e) => setYear(Number(e.target.value))}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm">
            <FieldLabel>{t('backtest.initialBr')}</FieldLabel>
            <Input type="number" quant value={bankroll} onChange={(e) => setBankroll(Number(e.target.value))} />
          </label>
          <label className="text-sm">
            <FieldLabel>{t('backtest.kellyMult')}</FieldLabel>
            <Input type="number" quant step="0.05" value={kelly} onChange={(e) => setKelly(Number(e.target.value))} />
          </label>
          <label className="text-sm">
            <FieldLabel>{t('backtest.stakeCap')}</FieldLabel>
            <Input type="number" quant step="0.5" value={cap} onChange={(e) => setCap(Number(e.target.value))} />
          </label>
          <Button type="submit" variant="primary" disabled={sim.isPending || selectedYear == null} className="md:col-span-4 md:w-fit">
            {sim.isPending ? t('backtest.simulating') : t('backtest.runSimulation')}
          </Button>
        </form>
      </Card>

      {sim.isError && <p className="mb-4 text-sm text-danger">{String(sim.error)}</p>}

      {yearsQ.isLoading ? (
        <p className="text-sm text-muted">{t('backtest.loadingYears')}</p>
      ) : years.length === 0 ? (
        <EmptyState title={t('backtest.emptyCsvTitle')} hint={t('backtest.emptyCsvHint')} />
      ) : !summary ? (
        <EmptyState title={t('backtest.readyTitle')} hint={t('backtest.readyHint')} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: t('backtest.netPl'),
                value: `${summary.net_profit_eur >= 0 ? '+' : ''}${summary.net_profit_eur.toFixed(0)} €`,
              },
              { label: t('backtest.growth'), value: `${summary.growth_pct.toFixed(1)}%` },
              { label: t('backtest.roiStaked'), value: `${summary.roi_on_staked_pct.toFixed(1)}%` },
              { label: t('backtest.maxDd'), value: `${summary.max_drawdown_pct.toFixed(1)}%` },
            ].map((k) => (
              <StatTile key={k.label} label={k.label} value={k.value} className="px-4 py-3" />
            ))}
          </div>

          {history.length > 0 && (
            <Card variant="default" className="p-4">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted">{t('backtest.bankrollCurve')}</p>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BRAND.grid} />
                  <XAxis dataKey="date" tick={{ fill: BRAND.muted, fontSize: 11 }} />
                  <YAxis tick={{ fill: BRAND.muted, fontSize: 11 }} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="bankroll" stroke={BRAND.teal} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
