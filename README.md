# Lainé — boutique de pulls avec essayage virtuel

Boutique e-commerce (Next.js 16) où le client choisit un pull, ouvre sa caméra
et **se voit porter le pull en direct**, puis génère une **photo réaliste de lui habillé par IA**.

## Lancer

```bash
npm install
cp .env.example .env.local   # optionnel
npm run dev
```

Ouvrir http://localhost:3000 dans Chrome / Edge et autoriser la caméra.
La caméra exige `localhost` ou **HTTPS** en production.

## Stockage : local ou en ligne (automatique)

| | En local (aucune clé) | En ligne (clés présentes) |
|---|---|---|
| Produits, catégories, commandes, comptes | `data/db.json` | **Upstash Redis** (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) |
| Images envoyées dans l'admin | `data/uploads/` | **Cloudinary** (`CLOUDINARY_URL`) |
| Suivi du rendu IA | mémoire du serveur | Upstash Redis |

Sur Vercel, le disque est en lecture seule : **Redis et Cloudinary sont nécessaires** pour que
les modifications de l'admin, les commandes et les images soient conservées.

## Déployer sur Vercel

1. **Importer le repo** sur [vercel.com/new](https://vercel.com/new) (Next.js est détecté tout seul).
2. **Redis** : projet Vercel → *Storage* → *Upstash for Redis* (offre gratuite) → *Connect*.
   `KV_REST_API_URL` et `KV_REST_API_TOKEN` sont ajoutées automatiquement.
3. **Cloudinary** : créer un compte gratuit, copier l'*API environment variable* du tableau de bord,
   l'ajouter dans Vercel sous le nom `CLOUDINARY_URL`.
4. **Autres variables** (Settings → Environment Variables) : `AUTH_SECRET`, `ADMIN_EMAIL`,
   `ADMIN_PASSWORD`, `TRYON_PROVIDER`, `HF_TOKEN` — voir `.env.example`.
5. **Redéployer** (Deployments → ⋯ → Redeploy) pour prendre en compte les variables.

### Envoyer la base locale en ligne (optionnel)

Pour retrouver en ligne les produits, catégories et commandes créés en local :

```bash
# ajouter d'abord KV_REST_API_URL, KV_REST_API_TOKEN et CLOUDINARY_URL dans .env.local
npm run db:push
```

Le script envoie les images locales sur Cloudinary, remplace leurs adresses, puis écrit la base dans
Redis (il demande confirmation si la base en ligne n'est pas vide). Sans envoi, le site en ligne
démarre avec le catalogue de départ.

## Comment ça marche

| Étape | Technique | Fichier |
|---|---|---|
| Catalogue, fiche produit, panier | Next.js App Router + localStorage | `src/app`, `src/components/CartProvider.tsx` |
| Photos produits | vraies photos détourées (PNG) + points clés ; coloris par recoloration | `public/produits`, `src/lib/garments.ts`, `src/lib/products.ts` |
| Essayage live (aperçu) | MediaPipe Pose (navigateur, gratuit) ; la photo est déformée sur le corps (buste + manches qui suivent les bras), col coupé sous le menton | `src/components/TryOnModal.tsx`, `src/lib/warp.ts` |
| Rendu réaliste IA | capture caméra + photo du pull → modèle d'essayage IA → photo de la personne habillée | `src/app/api/tryon`, `src/lib/tryon-providers.ts` |

### Rendu IA : fournisseurs

- **Hugging Face (par défaut, gratuit)** : modèle open source IDM-VTON. ~30 s par image,
  quota gratuit limité par jour, parfois saturé. Un jeton gratuit `HF_TOKEN` donne plus d'essais.
  Les tâches sont gardées en mémoire : idéal pour tester / faire une démo, pas pour la production.
- **FASHN (payant)** : renseigner `FASHN_API_KEY` (ou `TRYON_PROVIDER=fashn`).

### Ajouter un pull

1. Photo à plat, de face, fond uni clair, manches visibles → PNG détouré dans `public/produits`.
2. Ajouter ses points clés (col, épaules, aisselles, coudes, poignets, bas) dans `src/lib/garments.ts`.
3. Ajouter le produit et ses coloris (`tint` / `filter`) dans `src/lib/products.ts`.

### Crédits photos

Photos de Wikimedia Commons (licences CC BY / CC BY-SA, crédits affichés en pied de page).
