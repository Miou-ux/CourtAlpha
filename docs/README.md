# CourtAlpha — Documentation

Projet **séparé** de `BettingHUD/` : interface React + API FastAPI en PREPROD.

## Index

| Document | Contenu |
|----------|---------|
| [GETTING_STARTED.md](GETTING_STARTED.md) | Installation, lancement local, dépannage |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Structure, lien avec BettingHUD, phases |
| [UI_DESIGN.md](UI_DESIGN.md) | Charte logo, couleurs EV/proba, typo, tuiles, composants |
| [PAGE_MAP.md](PAGE_MAP.md) | **8 pages Streamlit → routes React** (parcours complet) |
| [API.md](API.md) | Endpoints REST |
| [CHANGELOG.md](CHANGELOG.md) | Historique des évolutions |

## Projet parent

- Code ML, scrapers, daemons, Telegram : **`../BettingHUD/`**
- Doc opérationnelle prod : **`../BettingHUD/docs/`**
- Lien croisé : **`../BettingHUD/docs/WEB_REACT.md`**

## Convention

**Toute évolution** (API, UI, config, déploiement) doit mettre à jour :

1. `docs/CHANGELOG.md` (entrée datée)
2. Le doc technique concerné (`API.md`, `ARCHITECTURE.md`, …)
3. `README.md` à la racine si la procédure de lancement change

Voir aussi `AGENTS.md` à la racine du projet.
