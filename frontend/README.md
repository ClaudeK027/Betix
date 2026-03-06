# 🎨 BETIX — Documentation Technique Exhaustive du Frontend

> **Avertissement pour les développeurs** : Ce document est la source de vérité pour l'architecture frontend de BETIX. L'application utilise **Next.js (App Router)** avec une séparation stricte entre Server Components et Client Components, particulièrement autour des notions d'authentification et de monétisation (Paywall).

---

## 🏗️ 1. Architecture et Philosophie

Le frontend de BETIX est conçu pour être à la fois un outil marketing puissant (Landing Page premium, SEO) et une application SaaS réactive (Dashboard, Temps Réel).

- **Framework** : Next.js 15+ (App Router).
- **Styling** : Tailwind CSS + shadcn/ui.
- **Backend as a Service** : Supabase (Auth, Database, Storage).
- **Payment Gateway** : Mollie.
- **Déploiement cible** : Vercel.

### La Séparation Serveur / Client
Pour des raisons de performance et de sécurité, l'application maximise l'utilisation des Server Components (`page.tsx`, `layout.tsx` de base) pour récupérer les données essentielles côté serveur sans montrer de "loading spinners".
Les Client Components (`"use client"`) sont réservés à l'interactivité (Carrousels, Modales, AuthProvider).

---

## 🚀 2. Le Routage et les Gardiens (Guards)

Le système de routes de Next.js est organisé en groupes logiques (dossiers entre parenthèses) qui ne modifient pas l'URL mais appliquent des `layout.tsx` spécifiques.

### `src/app/(public)`
- **Contenu** : Landing Page (`page.tsx`), Conditions d'utilisation, Privacy.
- **Spécificité** : Totalement public, Server Side Rendered pour le SEO. L'accès à la base de données (ex: offres de prix sur la homepage) se fait avec le client Supabase serveur (`createClient()`).

### `src/app/(auth)`
- **Contenu** : Login, Signup, MFA, Reset Password.
- **Sécurité** : Si un utilisateur déjà connecté visite `/login`, il est redirigé vers `/dashboard`.

### `src/app/(dashboard)`
- **Contenu** : Le cœur de l'application (Matchs, Profil, Analytics).
- **La protection en 3 temps (Crucial)** :
  1. **Middleware (`src/middleware.ts`)** : Son seul rôle est de rafraîchir silencieusement le cookie de session Supabase (`supabase.auth.getUser()`). Il ne fait **aucune redirection**.
  2. **Server Guard (`layout.tsx`)** : Côté serveur, on vérifie la présence explicite d'un utilisateur. Si absent → redirection 302 vers `/login`. Cela empêche tout clignotement de l'interface.
  3. **Client Guard (`layout-client.tsx`)** : Gère les cas métier complexes après le chargement :
     - **MFA (Multi-Factor Authentication)** : Si l'utilisateur a configuré le MFA (Niveau `aal2` requis) mais s'est connecté en mot de passe simple (`aal1`), il est forcé vers la page `/mfa`.
     - **Paywall (`<SubscriptionWall />`)** : Si l'utilisateur n'a pas d'abonnement actif, tout le contenu de la page `children` est remplacé par le mur de paiement. Il ne peut techniquement pas voir la page sous-jacente. L'exception sont les pages de Profil, qui restent accessibles.

### `src/app/(admin)`
- **Contenu** : Panneau de contrôle des utilisateurs et abonnements.
- **Sécurité** : Restreint aux profils ayant le rôle `admin` en base de données.

---

## 🔐 3. Authentification et Données (Supabase)

Betix utilise l'écosystème **Supabase SSR (Server-Side Rendering)**.

### Les 3 Clients Supabase (`src/lib/`)
1. **`supabase/client.ts`** : Utilisé dans les composants `"use client"`. Il accède à la session via le cookie navifgateur existant.
2. **`supabase/server.ts`** : Utilisé dans les composants serveurs, Server Actions et l'API. Il reconstruit la session depuis l'en-tête de la requête.
3. **`supabase-admin.ts`** : **DANGER**. Utilise la Service Role Key. Il contourne toutes les règles RLS (Row Level Security). Principalement utilisé pour les Webhooks de paiement.

### `AuthProvider` (`src/components/auth/AuthProvider.tsx`)
Enveloppe toute l'application (dans `app/layout.tsx`).
- Il hydrate l'état global de l'utilisateur (Profile `public.profiles`, Statut MFA, Abonnement `public.subscriptions`).
- Il offre le hook `useAuth()` utilisé partout pour obtenir `profile`, `isLoading`, `subscription`, et `isAdmin`.

---

## 💳 4. Le Flux de Paiement (Mollie)

Contrairement à Stripe, Mollie a été implémenté via des APIs REST natives (sans dépendre de Webhooks frontend complexes gérés par le SDK).

### Le Cycle d'Abonnement
1. **L'utilisateur choisit un plan métier** via le `SubscriptionWall` ou la page Pricing.
2. **Lien de Checkout** : Le bouton "S'abonner" redirige vers un route d'API interne : `/api/mollie/checkout?planId=X`.
3. **Création du paiement (`checkout/route.ts`)** : Le backend vérifie le plan, contacte Mollie via API, génère un lien de paiement unique, et redirige l'utilisateur vers la page hébergée par Mollie.
4. **Validation (Le Webhook `webhook/route.ts`)** :
   - Mollie post à cette URL lorsque le paiement réussit.
   - Le script contourne le RLS via `supabase-admin`.
   - Si c'est un premier paiement de séquence (`first`), il demande à Mollie de créer un abonnement récurrent (`customerSubscriptions.create`) pour ce client.
   - L'abonnement est inséré en base avec la date `current_period_end`.
5. **Accès immédiat** : Lors du retour sur Betix (page `/dashboard/subscription/success`), le `SubscriptionWall` consulte en temps réel la BDD (grâce à Supabase Realtime ou via un `router.refresh()`) et débloque le dashboard.

---

## 🧩 5. Composants Critiques du Dashboard

### `MatchCard.tsx` / `MatchTable.tsx`
- Reçoivent un objet complet de type `Match` (défini dans `src/types/match.ts`).
- Ils incorporent la logique **d'affichage de statut** : En fonction du sport et que le live monitor backend ait mis le statut à `imminent`, `live` ou `finished`, le badge clignotant s'affiche ou disparaît.

### `PremiumGate.tsx`
Un composant utilitaire wrapper. Vous voulez cacher un bouton spécifique ou une statistique si l'utilisateur n'est pas premium ? Enveloppez-le : 
```tsx
<PremiumGate fallback={<LockIcon />}>
  <SuperSecretAIAnalysis />
</PremiumGate>
```

---

## 📖 6. Guide d'Intervention pour Développeur Frontend

**1. Comment modifier l'apparence des offres au Paywall ?**
- Les offres affichées dans `<SubscriptionWall />` sont dynamiques et tirées de la base `public.plans`. Vous pouvez changer les prix ou l'ordre depuis le panneau Supabase Admin.
- Si vous rajoutez une fonctionnalité (ex: "Accès Telegram"), ajoutez la définition du label francisé dans la table `public.feature_definitions`.

**2. Comment rajouter une route Dashboard sans Paywall ? (ex: /dashboard/settings)**
- Allez dans `src/app/(dashboard)/layout-client.tsx`.
- Dans le bloc de logique `const needsSubscription`, ajoutez votre nouvelle route :
```javascript
const isExcludedPath = pathname === "/dashboard/profile" || pathname === "/dashboard/settings" || pathname.startsWith("/onboarding");
```

**3. Le CSS et Theming**
- Le thème est 100% "Dark Mode". Pas de light mode.
- Lisez `globals.css` : Le design system v2 repose sur des CSS Variables pour les couleurs fonctionnelles (`--color-safe`, `--color-value`, `--color-risky`, `--color-live`) mappées sur les stats IA. N'utilisez pas de couleurs hexadécimales brutes dans Tailwind, utilisez les variables sémantiques.

**4. Gestion des Erreurs API**
- L'acquisition de données (Supabase) dans les Client Components se doit d'être silencieuse. 
- Utilisez les Toast notifications de `sonner` via la fonction `toast.error("Message")` plutôt que des alertes disgracieuses.
