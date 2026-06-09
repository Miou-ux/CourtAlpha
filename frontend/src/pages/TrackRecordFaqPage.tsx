import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHero } from '../components/PageHero'
import { SeoFaq } from '../components/SeoFaq'
import { getTrackRecordFaq } from '../lib/seo'
import { publicPathFor } from '../lib/seoData'

export function TrackRecordFaqPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'fr'
  const pickPath = publicPathFor('/1-day-1-pick', lang)

  return (
    <div>
      <PageHero
        kicker={t('trackRecordFaq.kicker')}
        title={t('trackRecordFaq.title')}
        subtitle={t('trackRecordFaq.subtitle')}
      />
      <SeoFaq items={getTrackRecordFaq(i18n.language)} />
      <p className="mt-6 text-sm text-muted">
        <Link to={pickPath} className="text-accent hover:underline">
          {t('trackRecordFaq.backToPick')}
        </Link>
        {' · '}
        <Link to={publicPathFor('/methodo', lang)} className="text-accent hover:underline">
          {t('nav.methodo')}
        </Link>
      </p>
    </div>
  )
}
