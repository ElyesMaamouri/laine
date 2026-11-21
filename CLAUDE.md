@AGENTS.md

# Lainé — boutique de pulls avec essayage virtuel (contexte pour reprendre le travail)

Répondre en **français**. Le propriétaire (Elyes) prépare une **démo client** ; il teste en local puis en ligne.

## En ligne
- Site : https://laine-mocha.vercel.app — admin : `/admin` (identifiants dans `.env.local` / variables Vercel, jamais dans le code).
- GitHub : `ElyesMaamouri/laine`, branche `main`. **Chaque push sur `main` redéploie Vercel** (~1 min).
- Local : `npm run dev -- -p 3100` → http://localhost:3100

## Stack
Next.js 16 (App Router, **Cache Components activé**, Turbopack) · React 19 · Tailwind 4 · TypeScript.
Lire `node_modules/next/dist/docs/` avant d'utiliser une API Next (voir AGENTS.md).
- `cookies()` / `params` sont **async** ; pages dynamiques : `export const instant = false`.
- Données catalogue mises en cache : `getCatalog()`, `getHome()`, `getSettings()` (`'use cache'` + `cacheTag("catalog")`) dans `src/lib/server/catalog.ts` ; les actions admin appellent `updateTag(CATALOG_TAG)`.
- Pas de `usePathname/useParams` hors `<Suspense>` (l'admin est enveloppé dans un Suspense, `src/app/admin/layout.tsx`).

## Stockage (bascule automatique)
- Un seul document JSON (`Data` dans `src/lib/server/db.ts`) : users, orders, catalog, promos, home, settings, reviews. Toujours passer par `read()` / `write()`.
- Local : `data/db.json` (ignoré par git). En ligne : **Upstash Redis** (`KV_REST_API_URL` / `KV_REST_API_TOKEN`), clé `laine:db`.
- Images admin : local `data/uploads` (servies par `/api/uploads/[name]`) ; en ligne **Cloudinary** (`CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` ou `CLOUDINARY_URL`). Nettoyage automatique des images inutilisées (`cleanUploads` dans `src/app/admin/actions.ts`).
- `npm run db:push` envoie la base locale (et ses images) vers Redis/Cloudinary.
- Si `.env.local` contient les clés Redis, **le site local écrit dans la base en ligne**.

## Règles métier
- Prix toujours **recalculés côté serveur** (`priceLines` dans `src/lib/pricing.ts`) ; livraison et devise viennent des **Paramètres** (`src/lib/settings.ts`, `applySettings`).
- Codes promo : `src/lib/promos.ts` (dates AAAA-MM-JJ, heure de Paris, bornes incluses) ; revérifiés dans `/api/orders`.
- Avis : uniquement clients connectés avec une commande **livrée** contenant le produit ; publiés après validation (`/admin/avis`).
- Rattachement d'une commande sans compte : numéro + téléphone (les e-mails ne sont pas vérifiés à l'inscription).
- Ne jamais afficher d'avis, de compteurs ou de minuteurs inventés (pratiques trompeuses).

## Carte du code
- Boutique : `src/app/page.tsx` (sections d'accueil `src/components/home/Sections.tsx`, contenu `src/lib/home.ts`), `produit/[id]`, `categorie/[slug]`, `panier`, `commande`, `suivi`, `favoris`, `compte`.
- Essayage : `src/components/TryOnModal.tsx` (MediaPipe + `src/lib/warp.ts`), rendu IA `src/app/api/tryon` + `src/lib/tryon-providers.ts` (Hugging Face IDM-VTON gratuit ou FASHN).
- Admin : `src/app/admin/*` (pages client) + `src/app/admin/actions.ts` (server actions, `guard()` admin) ; cadre `src/components/admin/AdminShell.tsx` (menu `NAV`).
- Données de démo : `src/lib/demo-data.ts` (bouton « Charger les données de démo » du tableau de bord).

## Habitudes de travail
- Vérifier : `npx tsc --noEmit`, `npx eslint src`, `npm run build`, puis test réel (local, puis en ligne après push).
- Commits en français, un commit par fonctionnalité, ne jamais commiter `.env.local` ni `data/`.
