import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Link2, Share2 } from 'lucide-react'
import { SHARE_TRACK_RECORD_URL } from '../lib/seo'

export function ShareTrackRecord() {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(SHARE_TRACK_RECORD_URL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('share.shareTitle'),
          text: t('share.shareText'),
          url: SHARE_TRACK_RECORD_URL,
        })
        return
      } catch {
        /* user cancelled */
      }
    }
    await copyLink()
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void shareNative()}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm text-white hover:border-accent/40"
      >
        <Share2 className="h-4 w-4 text-accent" />
        {t('share.share')}
      </button>
      <button
        type="button"
        onClick={() => void copyLink()}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm text-muted hover:border-accent/40 hover:text-white"
      >
        {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
        {copied ? t('share.linkCopied') : t('share.copyLink')}
      </button>
    </div>
  )
}
