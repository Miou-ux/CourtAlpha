import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { CourtAlphaLogoMark } from '../components/CourtAlphaLogo'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { FieldLabel, Input } from '../components/ui/input'

type Mode = 'login' | 'forgot' | 'reset'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const resetToken = searchParams.get('reset_token')?.trim() || ''

  const [mode, setMode] = useState<Mode>(resetToken ? 'reset' : 'login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
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
            ? 'Réinitialisation du mot de passe par e-mail.'
            : mode === 'reset'
              ? 'Choisissez un nouveau mot de passe.'
              : 'Connexion à votre espace tennis — probas modèle, value bets et suivi portefeuille.'}
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
              <FieldLabel>Identifiant</FieldLabel>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            </label>
            <label className="block text-sm">
              <FieldLabel>Mot de passe</FieldLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" variant="primary" disabled={pending} className="w-full">
              {pending ? 'Connexion…' : 'Se connecter'}
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
              Mot de passe oublié ?
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
              <FieldLabel>E-mail du compte</FieldLabel>
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
              {pending ? 'Envoi…' : 'Envoyer le lien'}
            </Button>
            <button type="button" onClick={goLogin} className="w-full text-center text-sm text-muted transition hover:text-white">
              ← Retour à la connexion
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <>
            {tokenValid === null && <p className="text-sm text-muted">Vérification du lien…</p>}
            {tokenValid === false && (
              <div className="space-y-4">
                <p className="text-sm text-danger">Lien invalide ou expiré (1 h). Demandez un nouveau lien.</p>
                <Button type="button" variant="primary" className="w-full" onClick={() => setMode('forgot')}>
                  Nouveau lien
                </Button>
                <button type="button" onClick={goLogin} className="w-full text-center text-sm text-muted transition hover:text-white">
                  ← Retour à la connexion
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
                    setError('Les mots de passe ne correspondent pas.')
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
                  <FieldLabel>Nouveau mot de passe</FieldLabel>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </label>
                <label className="block text-sm">
                  <FieldLabel>Confirmer</FieldLabel>
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
                  {pending ? 'Enregistrement…' : 'Enregistrer'}
                </Button>
              </form>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
