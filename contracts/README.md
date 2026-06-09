# CourtAlphaPay — déploiement (legacy)

> **Mode recommandé** : adresses de dépôt HD (`COURTALPHA_BILLING_MNEMONIC` + RPC). Ce contrat reste supporté en fallback si mnemonic absent.

## 1. Compiler / déployer (Remix)

1. Ouvrir [Remix](https://remix.ethereum.org) → `CourtAlphaPay.sol`
2. Compiler **0.8.20+**
3. Déployer sur **Base Sepolia** (test) ou **Base** (prod) avec MetaMask
4. Noter l'adresse du contrat déployé

## 2. Variables serveur (`/opt/bettinghud/.env` ou `/opt/courtalpha/.env`)

### Mode HD (recommandé)

```env
COURTALPHA_BILLING_ENABLED=1
COURTALPHA_BILLING_MNEMONIC="votre phrase seed de 12 ou 24 mots"
COURTALPHA_BILLING_RPC_URL=https://mainnet.base.org
COURTALPHA_BILLING_CHAIN_ID=8453
COURTALPHA_BILLING_PRICE_WEI=500000000000000
```

### Mode contrat (legacy)

```env
COURTALPHA_BILLING_ENABLED=1
COURTALPHA_BILLING_CONTRACT=0xVotreContrat
COURTALPHA_BILLING_RPC_URL=https://sepolia.base.org
COURTALPHA_BILLING_CHAIN_ID=84532
COURTALPHA_BILLING_PRICE_WEI=100000000000000
```

| Réseau | `CHAIN_ID` |
|--------|------------|
| Base Sepolia (test) | `84532` |
| Base mainnet | `8453` |

## 3. Indexer (cron)

```bash
sudo cp /opt/bettinghud/deploy/cron/billing-indexer /etc/cron.d/bettinghud-billing
sudo systemctl restart cron
```

Test manuel :

```bash
cd /opt/bettinghud
./venv/bin/python scripts/billing_indexer.py
```

## 4. Retrait des fonds

- **HD** : dériver la clé privée depuis la mnemonic (`scripts/billing_hd.py`, index dans `billing_orders.address_index`)
- **Contrat** : appeler `withdraw(votre_adresse)` depuis le wallet deployer (owner du contrat)
