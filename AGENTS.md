# Instructions agents — CourtAlpha

À chaque évolution du projet, **mettre à jour la doc** :

1. **`docs/CHANGELOG.md`** — entrée datée (quoi / pourquoi)
2. **`docs/API.md`** — si endpoints ou payloads changent
3. **`docs/PAGE_MAP.md`** — si parité Streamlit ou routes UI changent
4. **`../BettingHUD/docs/WEB_REACT.md`** — si le lien avec le moteur ou la prod évolue

## Contexte

- **CourtAlpha** : React + FastAPI (PREPROD)
- **BettingHUD** (frère) : moteur Python, ne pas casser Streamlit prod
- `BETTINGHUD_ROOT` pointe toujours vers le dépôt moteur
