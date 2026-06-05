# Design UI — CourtAlpha

Référence produit : [SoDeglingo](https://sodeglingo.io/) — interface sombre, cartes premium, tableaux data.

Charte visuelle alignée sur le **logo CourtAlpha** (court de tennis + courbe de croissance, lime / teal / cyan).

---

## 1. Logo

| Élément | Chemin / composant |
|---------|-------------------|
| Fichier | `frontend/public/courtalpha-logo.png` |
| Composant | `CourtAlphaLogo.tsx` |
| Affichage | Sidebar `size="xl"` (~280 px) · Login `size="lg"` · favicon PNG |

Le PNG est traité pour un **vrai fond transparent** (damier et blancs supprimés en pré-traitement Python/Pillow).

---

## 2. Tokens couleur (`index.css` + `lib/brand.ts`)

### Fond & structure

| Token | Hex | Usage |
|-------|-----|--------|
| `bg` | `#121212` | Fond page |
| `bg-elevated` | `#1A1C23` | Sidebar |
| `panel` | `#1E2128` | Cartes |
| `border` | `#2A3040` | Contours |
| `muted` | `#8B93A7` | Texte secondaire |

### Sémantique données (ne pas confondre accent marque et EV)

| Token | Hex | Usage |
|-------|-----|--------|
| `accent` / `brand` | `#C8F135` | Marque, nav active, **EV ≥ 15 %**, badge `EV+` |
| `teal` / `success` | `#00D4C8` | **EV 8–15 %**, value, charts ATP, badge ATP |
| `cyan` / `proba` | `#00D4FF` | **Proba modèle** |
| `stake` | `#FFD93D` | **Mise Kelly** recommandée |
| `danger` | `#FF4757` | EV négatif |
| `warning` | `#FFD93D` | Alertes (alias stake) |

`lib/brand.ts` centralise les hex pour **Recharts** (Top probas, Backtest, Tracking).

---

## 3. Typographie

| Rôle | Police | Classe |
|------|--------|--------|
| UI | Inter | `font-sans` (défaut body) |
| Titres pages | Montserrat | `font-display` |
| Cotes, EV, % | JetBrains Mono | `.quant` |

### Échelle compacte (juin 2026)

Tailles Tailwind surchargées dans `@theme` (~1 cran sous le défaut) :

| Classe | Taille |
|--------|--------|
| `text-xs` | 11 px |
| `text-sm` | 13 px |
| `text-base` | 14 px (body) |
| `text-lg` | 16 px |
| `text-xl` | 18 px |
| `text-2xl` | 21 px |

---

## 4. Paliers EV (`lib/evDisplay.ts` + `lib/liveMetrics.ts`)

| Palier | Seuil | Couleur | UI |
|--------|-------|---------|-----|
| `strong` | EV ≥ 15 % | Lime `accent` | Pastille `EvPill`, bordure gauche carte, glow, badge `EV+` |
| `ok` | 8–15 % | Teal | Pastille, bordure gauche, cote teintée |
| `weak` | 0–8 % | Blanc / neutre | Pas de mise en avant forte |
| `neg` | &lt; 0 % | Rouge `danger` | Pastille + bordure danger |

Composants : `EvPill`, helpers `evPillClass`, `oddsHighlightClass`, `impliedEvPct` (grille matchs).

---

## 5. Tuiles interactives

Prop `interactive` sur `components/ui/card.tsx` → classe `.tile-lift`.

| État | Comportement |
|------|----------------|
| Repos | Bordure standard |
| `:hover` | `translateY(-4px)`, bordure teal ~22 %, ombre légère |
| `:active` | `translateY(-2px)` |

**À éviter** (provoque flou texte) : `scale`, `filter: brightness`, `will-change` permanent.

Cartes concernées : `ValueBetCard`, `PickCard`, `MatchCard`.

---

## 6. Shell layout

```
┌────────────┬────────────────────────────────────────────┐
│  Logo XL   │  Header : KPI snapshot · bankroll          │
│  Sidebar   ├────────────────────────────────────────────┤
│  · Live    │  PageHero + contenu                        │
│  · Paris   │  Tuiles / tableaux / graphiques            │
│  · …       │                                            │
└────────────┴────────────────────────────────────────────┘
```

- Grille desktop : `280px` sidebar + contenu
- Login : plein écran, pas de sidebar

---

## 7. Composants clés

| Composant | Rôle |
|-----------|------|
| `ValueBetCard` | Live value bets — proba, `EvPill`, cote éditable, Kelly, détails repliables |
| `PickCard` | Paris du jour / Top 5 |
| `MatchCard` | Grille matchs — cotes + proba + EV implicite par joueur |
| `PageHero` | Titre + stats `StatTile` |
| `FilterPills` | Circuit ATP/WTA + recherche |
| `BetModal` | Confirmation pari |
| `CourtAlphaLogo` | Logo PNG responsive |

---

## 8. Proba modèle (`lib/modelProba.ts`)

| Carte | Champ API prioritaire |
|-------|----------------------|
| Value / Pick | `p_model_pct`, `p_model_fav` |
| Match (par joueur) | `feature_snapshot.capped_p1_prob`, repli `p1_prob` |

Affichage **cyan** (`text-proba`). La cote observée reste modifiable indépendamment.

---

## 9. Filtres qualité données (moteur BettingHUD)

L’API applique `scripts/match_rank_quality.py` (même logique Streamlit PROD) :

- Cotes &gt; 1.0
- Rang/points fiables (hors `tennisexplorer_estimate` seul)
- `stats_reference_date` ≤ 12 mois (`BETTINGHUD_STALE_RANK_STATS_MAX_DAYS=365`)

---

## 10. Checklist doc à chaque évolution

1. `CHANGELOG.md` — entrée datée
2. `UI_DESIGN.md` — tokens / composants si impact visuel
3. `API.md` — si endpoints changent
4. `PAGE_MAP.md` — si routes changent
5. `BettingHUD/docs/WEB_REACT.md` — si lien moteur / prod évolue

---

## Historique

Voir `CHANGELOG.md` pour le détail chronologique (scaffold S1–S7, rebrand, session UI juin 2026).
