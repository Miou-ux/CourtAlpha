import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CourtAlphaLogoMark } from '../components/CourtAlphaLogo'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { FieldLabel, Input } from '../components/ui/input'

export function LoginPage() {
  const { user, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (user) return <Navigate to="/live" replace />

  return (
    <div>
      <div className="mb-8 text-center">
        <CourtAlphaLogoMark size="lg" className="mx-auto" />
        <p className="mt-5 text-sm leading-relaxed text-muted">
          Connexion à votre espace tennis — probas modèle, value bets et suivi portefeuille.
        </p>
      </div>
      <Card variant="elevated" className="brand-ring p-5 md:p-6">
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
        </form>
      </Card>
    </div>
  )
}
