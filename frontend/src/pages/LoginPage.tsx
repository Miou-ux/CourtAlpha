import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { CourtAlphaLogoMark } from '../components/CourtAlphaLogo'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { FieldLabel, Input } from '../components/ui/input'

type Mode = 'login' | 'forgot' | 'reset' | 'register'

export function LoginPage() {
  const { t } = useTranslation()
  const { user, login, register, registrationOpen } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const resetToken = searchParams.get('reset_token')?.trim() || ''

  const [mode, setMode] = useState<Mode>(resetToken ? 'reset' : 'login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirm, setRegisterConfirm] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(resetToken ? null : false)

  useEffect(() => {
    if (!resetToken) {
      setTokenValid(false)
      return
    }
    setMode('reset')
    let cancelled = false
    void api.authPasswordResetValidate(resetToken).then(
      (res) => {
        if (!cancelled) setTokenValid(res.valid)
      },
      () => {
        if (!cancelled) setTokenValid(false)
      },
    )
    return () => {
      cancelled = true
    }
  }, [resetToken])

  if (user) return <Navigate to="/live" replace />

  const goLogin = () => {
    setMode('login')
    setError(null)
    setMessage(null)
    if (resetToken) setSearchParams({})
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <CourtAlphaLogoMark size="lg" className="mx-auto" />
        <p className="mt-5 text-sm leading-relaxed text-muted">
          {mode === 'forgot'
            ? t('auth.subtitleForgot')
            : mode === 'reset'
              ? t('auth.subtitleReset')
              : mode === 'register'
                ? t('auth.subtitleRegister')
                : t('auth.subtitleLogin')}
        </p>
      </div>
      <Card variant="elevated" className="brand-ring p-5 md:p-6">
        {mode === 'login' && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              setError(null)
              setPending(true)
              try {
                await login(username, password)
              } catch (err) {
                setError(err instanceof Error ? err.message : String(err))
              } finally {
                setPending(false)
              }
            }}
          >
            <label className="block text-sm">
              <FieldLabel>{t('auth.username')}</FieldLabel>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            </label>
            <label className="block text-sm">
              <FieldLabel>{t('auth.password')}</FieldLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" variant="primary" disabled={pending} className="w-full">
              {pending ? t('auth.connecting') : t('auth.signIn')}
            </Button>
            <button
              type="button"
              onClick={() => {
                setMode('forgot')
                setError(null)
                setMessage(null)
              }}
              className="w-full text-center text-sm text-muted transition hover:text-accent"
            >
              {t('auth.forgotPassword')}
            </button>
            {registrationOpen && (
              <button
                type="button"
                onClick={() => {
                  setMode('register')
                  setError(null)
                  setMessage(null)
                }}
                className="w-full text-center text-sm text-accent transition hover:underline"
              >
                {t('auth.createAccount')}
              </button>
            )}
          </form>
        )}

        {mode === 'register' && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              setError(null)
              if (registerPassword !== registerConfirm) {
                setError(t('auth.passwordMismatch'))
                return
              }
              if (!email.trim()) {
                setError(t('auth.emailRequired'))
                return
              }
              setPending(true)
              try {
                await register({
                  username: username.trim(),
                  email: email.trim(),
                  password: registerPassword,
                  display_name: displayName.trim() || undefined,
                })
              } catch (err) {
                setError(err instanceof Error ? err.message : String(err))
              } finally {
                setPending(false)
              }
            }}
          >
            <label className="block text-sm">
              <FieldLabel>{t('auth.username')}</FieldLabel>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                autoComplete="username"
                placeholder="prenom_tennis"
              />
            </label>
            <label className="block text-sm">
              <FieldLabel>{t('auth.email')}</FieldLabel>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="vous@example.com"
              />
            </label>
            <label className="block text-sm">
              <FieldLabel>{t('auth.displayNameOptional')}</FieldLabel>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" />
            </label>
            <label className="block text-sm">
              <FieldLabel>{t('auth.password')}</FieldLabel>
              <Input
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label className="block text-sm">
              <FieldLabel>{t('auth.confirm')}</FieldLabel>
              <Input
                type="password"
                value={registerConfirm}
                onChange={(e) => setRegisterConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button
              type="submit"
              variant="primary"
              disabled={pending || !username.trim() || !email.trim() || !registerPassword}
              className="w-full"
            >
              {pending ? t('auth.creating') : t('auth.createMyAccount')}
            </Button>
            <button type="button" onClick={goLogin} className="w-full text-center text-sm text-muted transition hover:text-white">
              {t('auth.alreadyHaveAccount')}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              setError(null)
              setMessage(null)
              setPending(true)
              try {
                const res = await api.authPasswordResetRequest(email.trim())
                setMessage(res.message)
              } catch (err) {
                setError(err instanceof Error ? err.message : String(err))
              } finally {
                setPending(false)
              }
            }}
          >
            <label className="block text-sm">
              <FieldLabel>{t('auth.accountEmail')}</FieldLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="admin@courtalpha.tech"
              />
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            {message && <p className="text-sm text-success">{message}</p>}
            <Button type="submit" variant="primary" disabled={pending || !email.trim()} className="w-full">
              {pending ? t('auth.sending') : t('auth.sendLink')}
            </Button>
            <button type="button" onClick={goLogin} className="w-full text-center text-sm text-muted transition hover:text-white">
              {t('auth.backToLogin')}
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <>
            {tokenValid === null && <p className="text-sm text-muted">{t('auth.checkingLink')}</p>}
            {tokenValid === false && (
              <div className="space-y-4">
                <p className="text-sm text-danger">{t('auth.invalidLink')}</p>
                <Button type="button" variant="primary" className="w-full" onClick={() => setMode('forgot')}>
                  {t('auth.newLink')}
                </Button>
                <button type="button" onClick={goLogin} className="w-full text-center text-sm text-muted transition hover:text-white">
                  {t('auth.backToLogin')}
                </button>
              </div>
            )}
            {tokenValid === true && (
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault()
                  setError(null)
                  if (newPassword !== confirmPassword) {
                    setError(t('auth.passwordMismatch'))
                    return
                  }
                  setPending(true)
                  try {
                    const res = await api.authPasswordResetConfirm(resetToken, newPassword)
                    setMessage(res.message)
                    setSearchParams({})
                    setTimeout(() => navigate('/login', { replace: true }), 1500)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : String(err))
                  } finally {
                    setPending(false)
                  }
                }}
              >
                <label className="block text-sm">
                  <FieldLabel>{t('auth.newPassword')}</FieldLabel>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </label>
                <label className="block text-sm">
                  <FieldLabel>{t('auth.confirm')}</FieldLabel>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </label>
                {error && <p className="text-sm text-danger">{error}</p>}
                {message && <p className="text-sm text-success">{message}</p>}
                <Button type="submit" variant="primary" disabled={pending} className="w-full">
                  {pending ? t('auth.saving') : t('auth.save')}
                </Button>
              </form>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
