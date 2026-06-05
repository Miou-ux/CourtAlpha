import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { PageHero } from '../components/PageHero'
import { UserAvatar } from '../components/UserAvatar'
import { Badge } from '../components/Badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { FieldLabel, Input } from '../components/ui/input'
import { adminRoleLabel, isAdmin } from '../lib/auth'
import { useAuth } from '../context/AuthContext'

export function ProfilePage() {
  const { user, updateProfile, uploadAvatar } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [displayName, setDisplayName] = useState(user?.display_name ?? '')
  const [telegramUserId, setTelegramUserId] = useState(user?.telegram_user_id ?? '')
  const [telegramUsername, setTelegramUsername] = useState(user?.telegram_username ?? '')
  const [pending, setPending] = useState(false)
  const [avatarPending, setAvatarPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setDisplayName(user.display_name ?? '')
    setTelegramUserId(user.telegram_user_id ?? '')
    setTelegramUsername(user.telegram_username ?? '')
  }, [user])

  if (!user) {
    return (
      <div>
        <PageHero kicker="Compte" title="Mon profil" subtitle="Connectez-vous pour gérer votre profil." />
        <p className="text-sm text-muted">
          <a href="/login" className="text-accent hover:underline">
            Se connecter
          </a>
        </p>
      </div>
    )
  }

  return (
    <div>
      <PageHero kicker="Compte" title="Mon profil" subtitle="Photo, nom affiché et lien Telegram pour le suivi des paris." />

      <Card variant="elevated" className="max-w-lg p-5 md:p-6">
        <div className="mb-6 flex items-center gap-4">
          <UserAvatar user={user} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-white">{user.display_name}</p>
              {isAdmin(user) && <Badge tone="accent">{adminRoleLabel(user)}</Badge>}
            </div>
            <p className="text-xs text-muted">@{user.username}</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setError(null)
                setAvatarPending(true)
                try {
                  await uploadAvatar(file)
                  setMessage('Photo mise à jour.')
                } catch (err) {
                  setError(err instanceof Error ? err.message : String(err))
                } finally {
                  setAvatarPending(false)
                  e.target.value = ''
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={avatarPending}
              onClick={() => fileRef.current?.click()}
            >
              {avatarPending ? 'Envoi…' : 'Changer la photo'}
            </Button>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            setMessage(null)
            setPending(true)
            try {
              await updateProfile({
                display_name: displayName.trim(),
                telegram_user_id: telegramUserId.trim(),
                telegram_username: telegramUsername.trim(),
              })
              setMessage('Profil enregistré.')
            } catch (err) {
              setError(err instanceof Error ? err.message : String(err))
            } finally {
              setPending(false)
            }
          }}
        >
          <label className="block text-sm">
            <FieldLabel>Nom affiché</FieldLabel>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </label>

          <div className="rounded-xl border border-border bg-bg p-3">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <Send className="h-3.5 w-3.5" /> Compte Telegram
            </p>
            <label className="mb-3 block text-sm">
              <FieldLabel>ID Telegram</FieldLabel>
              <Input
                value={telegramUserId}
                onChange={(e) => setTelegramUserId(e.target.value.replace(/\D/g, ''))}
                placeholder="ex. 7113749284"
                quant
              />
            </label>
            <label className="block text-sm">
              <FieldLabel>Nom d&apos;utilisateur Telegram</FieldLabel>
              <Input
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value.replace(/^@/, ''))}
                placeholder="sans @"
              />
            </label>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              Lie votre bankroll et vos paris au bot Telegram (même logique que le dashboard Streamlit).
            </p>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          {message && <p className="text-sm text-teal">{message}</p>}

          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
