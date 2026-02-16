# 📐 BETIX — Cahier des Charges UI/UX Granulaire

> Ce document spécifie chaque page, chaque section, chaque composant, ses états, ses données et son comportement responsive. Il sert de blueprint pour le développement frontend de la Phase 2.

---

## Table des Matières

### Vue Utilisateur
1. [Composants Globaux (Shared)](#1-composants-globaux-shared)
2. [Landing Page](#2-landing-page)
3. [Pages Auth](#3-pages-auth)
4. [Dashboard](#4-dashboard)
5. [Page Détail Match](#5-page-détail-match)
6. [Page Pricing](#6-page-pricing)
7. [Page Profil Utilisateur](#7-page-profil-utilisateur)
8. [États Transversaux](#8-états-transversaux)
9. [Parcours Utilisateurs Détaillés](#9-parcours-utilisateurs-détaillés)

### Vue Admin (Tour de Contrôle)
10. [Admin — Layout & Navigation](#10-admin--layout--navigation)
11. [Admin — Dashboard Analytics](#11-admin--dashboard-analytics)
12. [Admin — Gestion Utilisateurs](#12-admin--gestion-utilisateurs)
13. [Admin — Gestion Abonnements & Revenus](#13-admin--gestion-abonnements--revenus)
14. [Admin — Configuration Système](#14-admin--configuration-système)
15. [Admin — Centre de Notifications](#15-admin--centre-de-notifications)
16. [Admin — Parcours Admin Détaillés](#16-admin--parcours-admin-détaillés)

### Référentiel
17. [Inventaire Complet des Composants React](#17-inventaire-complet-des-composants-react)

---

## 1. Composants Globaux (Shared)

Ces composants apparaissent sur plusieurs pages et doivent être conçus en premier.

### 1.1 `<Navbar />` (Navigation Principale)

**Variantes** :
- **Public** (Landing, Pricing, Auth) : Logo + Liens (Fonctionnalités, Pricing) + CTA "Se connecter" / "S'inscrire".
- **Privé** (Dashboard, Match, Profil) : Logo + SportSelector + CreditsCounter + UserMenu.

**Composants internes** :
| Composant | Description | Données | Interaction |
|---|---|---|---|
| `<Logo />` | Logo BETIX cliquable | Aucune | Clic → Retour Landing (public) ou Dashboard (privé) |
| `<NavLinks />` | Liens de navigation | Liste de routes | Clic → Navigation. Active state sur la route courante |
| `<SportSelector />` | Tabs ⚽🏀🎾 | Sport actif (state) | Clic → Change le sport, recharge les matchs |
| `<CreditsCounter />` | "2/2 analyses restantes" | `user.free_predictions_used` | Affiche le compteur. Pulse animation quand 0 reste |
| `<UserMenu />` | Avatar + Dropdown | `user.name`, `user.subscription_status` | Clic → Menu (Profil, Paramètres, Déconnexion). Badge "PRO" si abonné |

**Comportement Responsive** :
- **Desktop** (≥1024px) : Barre horizontale fixe en haut, tous les éléments visibles.
- **Mobile** (<1024px) : Logo + Hamburger menu. SportSelector déplacé sous la navbar comme tabs scrollables horizontalement. CreditsCounter dans le menu hamburger.

**États** :
- `scrolled` : Quand l'utilisateur scrolle, la navbar passe en fond `bg-slate-900/80 backdrop-blur-lg` (glassmorphism).
- `menu-open` : Sur mobile, le menu s'ouvre en overlay plein écran avec animation slide-in.

---

### 1.2 `<Footer />`

**Utilisé sur** : Landing, Pricing uniquement (pas dans le Dashboard).

**Sections** :
| Section | Contenu |
|---|---|
| Colonne 1 — Brand | Logo + Tagline ("Pronostics IA pour parieurs exigeants") |
| Colonne 2 — Produit | Liens : Fonctionnalités, Pricing, FAQ |
| Colonne 3 — Légal | Liens : CGU, Politique de confidentialité, Mentions légales |
| Colonne 4 — Contact | Email support, Réseaux sociaux (icônes) |
| Barre du bas | "© 2026 BETIX. Tous droits réservés." + Avertissement jeu responsable |

**Responsive** : 4 colonnes desktop → 2 colonnes tablette → 1 colonne mobile (empilées).

---

### 1.3 `<Toast />` (Notifications)

Notifications éphémères qui apparaissent en bas à droite (desktop) ou en haut (mobile).

| Type | Couleur | Icône | Exemple |
|---|---|---|---|
| `success` | Emerald | ✅ | "Abonnement activé avec succès !" |
| `error` | Red | ❌ | "Erreur de paiement. Veuillez réessayer." |
| `info` | Blue | ℹ️ | "Nouvelle analyse disponible pour PSG vs Marseille" |
| `warning` | Amber | ⚠️ | "Il ne vous reste qu'une analyse gratuite" |

**Comportement** : Apparaît avec animation slide-in, disparaît après 5s ou au clic sur "×".

---

### 1.4 `<LoadingSkeleton />`

Placeholder animé (shimmer effect) affiché pendant le chargement des données.

**Variantes** :
- `skeleton-card` : Forme de carte match (rectangle arrondi).
- `skeleton-text` : Lignes de texte (3-4 barres de hauteurs variables).
- `skeleton-gauge` : Cercle pour la jauge de confiance.

---

### 1.5 `<PaywallOverlay />`

Composant de blocage qui apparaît par-dessus le contenu pour les utilisateurs gratuits ayant épuisé leur quota.

**Structure** :
- Fond : `backdrop-blur-md` (le contenu réel est flouté en arrière-plan, visible mais illisible).
- Cadre central :
  - Icône 🔒
  - Titre : "Débloquez l'analyse complète"
  - Sous-titre : "Accédez à toutes les analyses IA pour seulement 1€/mois"
  - `<Button variant="primary" size="lg">` → "Passer Premium"
  - Lien discret : "Voir les offres"

**Données requises** : `user.subscription_status`, `user.free_predictions_used`.

---

## 2. Landing Page

**Route** : `/`
**Objectif** : Conversion visiteur → inscription.
**Layout** : Page scroll unique (one-page), pas de sidebar.

### 2.1 Section Hero

| Composant | Détail |
|---|---|
| `<HeroHeadline />` | Titre principal : ex. "L'IA qui bat les bookmakers". Police `text-5xl font-bold` desktop, `text-3xl` mobile. Gradient text (blue → indigo) |
| `<HeroSubtitle />` | Sous-titre explicatif (1-2 lignes). `text-lg text-slate-400` |
| `<HeroCTA />` | Deux boutons : "Essai Gratuit" (Primary, grand) + "Voir une démo" (Ghost). Espacement horizontal desktop, empilés verticalement mobile |
| `<HeroVisual />` | Image ou illustration animée d'un dashboard. Positionnée à droite (desktop) ou en dessous (mobile). Effet parallaxe léger au scroll |
| `<TrustBadges />` | Bandeau sous le hero : "🔒 Données sécurisées · ⚡ Analyses en temps réel · 🎯 +10 000 pronostics générés". `text-sm text-slate-500` |

**Données** : Statiques (pas d'appel API).

---

### 2.2 Section "Comment ça marche" (How It Works)

3 étapes illustrées en colonnes :
| Étape | Icône | Titre | Description |
|---|---|---|---|
| 1 | 📊 | "On collecte les données" | "Stats de forme, blessures, confrontations directes, météo... Notre IA digère des centaines de points de données." |
| 2 | 🧠 | "L'IA analyse" | "Notre moteur d'intelligence artificielle croise les données et génère 3 scénarios de pari." |
| 3 | 🎯 | "Vous décidez" | "Choisissez le niveau de risque qui vous correspond : Safe, Intermédiaire, ou Risqué." |

**Composant** : `<StepCard />` avec icône animée au scroll (fade-in + slide-up).
**Responsive** : 3 colonnes desktop → empilées verticalement mobile.

---

### 2.3 Section "Sports Couverts"

3 cartes Sport côte à côte :
| Composant | Détail |
|---|---|
| `<SportShowcaseCard />` | Grande carte avec : Icône sport + Nom + Exemples de ligues couvertes + Nombre de matchs analysés par jour (mock). Effet hover : légère élévation + border glow couleur sport |

**Sports** :
- ⚽ Football : "Premier League, Liga, Ligue 1, Champions League..."
- 🏀 Basketball : "NBA, Euroleague, Liga ACB..."
- 🎾 Tennis : "ATP, WTA, Grand Slams..."

---

### 2.4 Section "Exemple de Prédiction" (Live Demo)

**Composant** : `<DemoPredictor />`

C'est un **mini-widget interactif** montrant un exemple de prédiction fictive. L'utilisateur peut cliquer sur les onglets Safe/Medium/Risky pour voir les différents niveaux.

**Structure** :
- En-tête : Match fictif ("PSG vs Marseille — Ligue 1").
- 3 onglets cliquables (Safe 🟢 / Value 🟡 / Risky 🔴).
- Contenu de l'onglet actif :
  - Prédiction : "Victoire PSG + Plus de 2.5 buts"
  - Cote : "1.65"
  - Confiance : Jauge à 82%
  - Résumé : 2-3 lignes d'analyse
  - Facteurs clés : 3 bullets (✅ Forme domicile, ⚠️ Mbappé incertain, ✅ H2H favorable)
- **Appel à l'action** sous le widget : "Recevez cette analyse pour vos matchs → Inscription gratuite"

**Note** : Toutes les données sont codées en dur (mock). Pas d'appel API.

---

### 2.5 Section Témoignages / Social Proof

| Composant | Détail |
|---|---|
| `<TestimonialCard />` | Photo (avatar), nom, citation, note (★★★★★). Border gauche colorée |
| Carousel | 3 témoignages, scroll auto ou swipe sur mobile |

**Données** : Statiques (fictifs pour le MVP, remplacés par de vrais avis plus tard).

---

### 2.6 Section Pricing (Preview)

Aperçu rapide des tarifs avec un CTA vers la page `/pricing` complète.

| Élément | Détail |
|---|---|
| Titre | "Des analyses IA à partir de 1€/mois" |
| 2 cartes côte à côte | "Gratuit" vs "Premium" avec la liste des fonctionnalités |
| CTA | "Voir tous les plans" → lien vers `/pricing` |

---

### 2.7 Section FAQ

**Composant** : `<AccordionFAQ />`
- Liste de questions/réponses en accordéon (clic pour déplier).
- Questions clés :
  1. "Est-ce que BETIX garantit des gains ?"
  2. "Comment fonctionne l'analyse IA ?"
  3. "Quels sports sont couverts ?"
  4. "Comment annuler mon abonnement ?"
  5. "Les données sont-elles fiables ?"

---

### 2.8 Section CTA Final

Bandeau plein écran avec gradient (blue → indigo) :
- Titre : "Prêt à passer au niveau supérieur ?"
- CTA : "Commencer gratuitement" (bouton blanc sur fond coloré).

---

## 3. Pages Auth

### 3.1 Page Login (`/login`)

**Layout** : Split screen (desktop). Gauche = formulaire, Droite = visuel/illustration.

**Composants du formulaire** :
| Composant | Détail |
|---|---|
| `<InputField label="Email" type="email" />` | Validation : format email. État erreur : bordure rouge + message |
| `<InputField label="Mot de passe" type="password" />` | Toggle visibilité (icône œil). Min 8 caractères |
| `<Button type="submit">` | "Se connecter" — Disabled si champs vides. Loading spinner pendant la requête |
| `<OAuthButton provider="google" />` | "Continuer avec Google" — Icône Google + texte |
| `<Link />` | "Mot de passe oublié ?" → `/reset-password` |
| `<Link />` | "Pas encore de compte ? S'inscrire" → `/signup` |

**États du formulaire** :
- `idle` : Formulaire vierge.
- `loading` : Bouton disabled + spinner.
- `error` : Message sous le champ fautif ("Email ou mot de passe incorrect").
- `success` : Redirect vers `/dashboard`.

**Responsive** : Split screen desktop → formulaire centré plein écran mobile (visuel masqué).

---

### 3.2 Page Signup (`/signup`)

Identique au Login avec les champs supplémentaires :
| Composant | Détail |
|---|---|
| `<InputField label="Nom complet" />` | Min 2 caractères |
| `<InputField label="Email" />` | Validation format + unicité (vérification côté serveur) |
| `<InputField label="Mot de passe" />` | Min 8 chars, indicateur de force (faible/moyen/fort) |
| `<InputField label="Confirmer le mot de passe" />` | Doit correspondre au champ précédent |
| `<Checkbox />` | "J'accepte les CGU et la politique de confidentialité" (obligatoire) |
| `<Button>` | "Créer mon compte" |
| `<OAuthButton provider="google" />` | "S'inscrire avec Google" |

**Post-inscription** : Redirect vers un écran d'Onboarding.

---

### 3.3 Onboarding Post-Inscription (`/onboarding`)

**3 étapes (Stepper)** :

| Étape | Composant | Détail |
|---|---|---|
| 1 — "Vos Sports" | `<SportSelectionGrid />` | 3 cartes cliquables (Football, Basketball, Tennis). Multi-sélection. Au moins 1 obligatoire. Effet "selected" = bordure bleue + checkmark |
| 2 — "Votre Profil" | `<ProfileSetup />` | Niveau d'expérience (Débutant / Intermédiaire / Expert) via `<RadioGroup />` |
| 3 — "C'est parti !" | `<OnboardingSummary />` | Résumé des choix + CTA "Accéder au Dashboard" |

**Indicateur de progression** : Barre de progression ou dots (●●○).
**Skip possible** : Lien "Passer" sur chaque étape (sauf la dernière).

---

### 3.4 Page Reset Password (`/reset-password`)

| Composant | Détail |
|---|---|
| `<InputField label="Email" />` | Email de récupération |
| `<Button>` | "Envoyer le lien de réinitialisation" |
| **État success** | Message "Un email vous a été envoyé à xxx@xxx.com" |

---

## 4. Dashboard

**Route** : `/dashboard`
**Objectif** : Vue d'ensemble des matchs du jour avec accès rapide aux analyses.
**Layout** : Navbar (top) + Contenu principal. Pas de sidebar.

### 4.1 `<DashboardHeader />`

| Composant | Détail |
|---|---|
| `<DateDisplay />` | "Mardi 11 Février 2026". Flèches ← → pour naviguer entre les jours. Bouton "Aujourd'hui" pour revenir |
| `<MatchCounter />` | "12 matchs disponibles" — Mise à jour dynamique selon les filtres |
| `<ViewToggle />` | Icônes pour basculer entre vue "Grille" (Bento) et vue "Liste" (compacte) |

---

### 4.2 `<SportTabs />`

Tabs horizontaux pour filtrer par sport.

| Tab | Label | Icône | Badge |
|---|---|---|---|
| Tous | "Tous" | 🏆 | Nombre total de matchs |
| Football | "Football" | ⚽ | Nombre de matchs foot |
| Basketball | "Basketball" | 🏀 | Nombre de matchs basket |
| Tennis | "Tennis" | 🎾 | Nombre de matchs tennis |

**État actif** : Background bleu + texte blanc.
**Responsive** : Tabs scrollables horizontalement sur mobile.

---

### 4.3 `<LeagueFilter />`

Filtre secondaire sous les SportTabs.
- **Type** : Dropdown multi-sélection OU pills cliquables.
- **Données** : Liste des ligues disponibles pour le sport sélectionné.
- **Exemple Football** : "Premier League", "Liga", "Ligue 1", "Serie A", "Bundesliga".
- **État par défaut** : "Toutes les ligues".

---

### 4.4 `<MatchGrid />` (Grille des Matchs)

**Layout** : CSS Grid — 3 colonnes desktop / 2 tablette / 1 mobile.

Chaque cellule contient un `<MatchCard />`.

---

### 4.5 `<MatchCard />`

C'est le composant le plus important du Dashboard. Il doit donner assez d'information pour inciter au clic sans surcharger.

**Structure interne** :
```
┌──────────────────────────────────┐
│ ⚽ Premier League      19:45    │ ← LeagueBadge + MatchTime
│                                  │
│  [Logo] Arsenal  2 - 1  Chelsea [Logo] │ ← TeamRow (logos + noms + score)
│                                  │
│  🟢 Safe · 85% confiance        │ ← QuickPredictBadge
│                                  │
│  ▸ Voir l'analyse               │ ← CTA Link
└──────────────────────────────────┘
```

| Sous-Composant | Données | Détail |
|---|---|---|
| `<LeagueBadge />` | `match.league.name`, `match.league.logo` | Petit logo ligue + nom. `text-xs text-slate-500` |
| `<MatchTime />` | `match.date` | Heure formatée. Si "LIVE" → `<LiveBadge />` animé rouge pulse |
| `<TeamRow />` | `match.home_team`, `match.away_team` + logos | Logos 32x32, noms en `font-medium`, score en `font-bold text-xl` (si en cours/terminé) |
| `<QuickPredictBadge />` | `prediction.confidence_level`, `prediction.confidence_score` | Badge coloré (🟢🟡🔴) + "85% confiance". Visible uniquement si une prédiction existe |
| `<CTALink />` | — | "Voir l'analyse →". Lien vers `/dashboard/match/[id]` |

**États** :
- `upcoming` : Score non affiché. Heure visible. Badge "À venir".
- `live` : Score mis à jour. Badge `<LiveBadge />` rouge pulsant. Bordure gauche verte.
- `finished` : Score final. Badge "FT" (Full Time). Opacité légèrement réduite.
- `loading` : `<LoadingSkeleton variant="card" />`.
- `hover` : `translate-y-[-2px]`, ombre augmentée, bordure subtile bleue.

**Données API** : `GET /api/matches/today?sport={sport}&league={league}`.

---

### 4.6 `<EmptyState />`

Quand aucun match n'est disponible pour les filtres sélectionnés.
- Illustration (icône triste ou calendrier vide).
- Texte : "Aucun match de {sport} prévu aujourd'hui."
- CTA : "Voir les matchs de demain →" ou "Explorer un autre sport".

---

## 5. Page Détail Match

**Route** : `/dashboard/match/[id]`
**Objectif** : Consommer la prédiction IA. C'est LE cœur de la valeur produit.
**Layout** : Pleine largeur, scroll vertical, sections empilées.

### 5.1 `<MatchHeader />`

Bandeau en haut de la page avec les infos essentielles du match.

```
┌─────────────────────────────────────────────────────────────┐
│  ⚽ Premier League — Matchday 24            🔴 LIVE 67'    │
│                                                              │
│     [Logo 64px]                    [Logo 64px]               │
│      Arsenal          2 — 1         Chelsea                  │
│                                                              │
│  📍 Emirates Stadium · ☁️ 12°C · 🕐 Coup d'envoi : 20:45   │
└─────────────────────────────────────────────────────────────┘
```

| Sous-Composant | Données | Détail |
|---|---|---|
| `<LeagueInfo />` | `match.league`, `match.round` | Logo + Nom ligue + Journée |
| `<MatchStatus />` | `match.status`, `match.elapsed` | "LIVE 67'" (pulsant) ou "20:45" ou "Terminé" |
| `<TeamDisplay />` | `team.name`, `team.logo`, `team.score` | Logo grande taille (64px), nom en `text-2xl font-bold`, score en `text-4xl` |
| `<MatchContext />` | `match.venue`, `match.weather` | Stade + Météo (important pour tennis/foot). `text-sm text-slate-400` |

---

### 5.2 `<PredictionPanel />`

**C'est le composant principal. Il occupe 60-70% de la largeur sur desktop.**

#### 5.2.1 `<RiskTabs />`

3 onglets pour les niveaux de prédiction :
| Onglet | Label | Couleur | Cote typique |
|---|---|---|---|
| Safe | "🟢 Prudent" | Emerald | 1.30–1.70 |
| Value | "🟡 Équilibré" | Amber | 1.80–2.50 |
| Risky | "🔴 Risqué" | Red | 3.00+ |

**État actif** : Bordure bottom colorée + fond légèrement teinté.
**Défaut** : Onglet "Safe" actif.

#### 5.2.2 `<PredictionContent />` (Contenu de l'onglet actif)

| Sous-Composant | Données | Détail |
|---|---|---|
| `<PredictionOutcome />` | `prediction.predicted_outcome` | Ex: "Victoire Arsenal + Plus de 2.5 buts". `text-lg font-semibold` |
| `<OddsDisplay />` | `prediction.odds_value` | Affichage de la cote : "Cote : 1.65". Avec sous-texte "Valeur estimée : ★★★☆☆" |
| `<ConfidenceGauge />` | `prediction.confidence_score` | **Jauge circulaire SVG** animée. Pourcentage au centre. Couleur dynamique (vert >70%, jaune 50-70%, rouge <50%) |
| `<AnalysisText />` | `prediction.prediction_text` | Texte d'analyse IA (3-5 paragraphes). Formaté en markdown (gras, italique). Scrollable si trop long |
| `<KeyFactors />` | `prediction.key_factors[]` | Liste de 4-6 facteurs. Chaque facteur : Icône (✅❌⚠️) + Texte + Impact (Positif/Négatif/Neutre). Rendu avec `<FactorChip />` |
| `<PredictedScore />` | `prediction.predicted_score` | Score prédit (ex: "2-1"). Affiché dans un mini-badge discret |

#### 5.2.3 `<GatingLayer />`

**Conditionnel** : Apparaît UNIQUEMENT si `user.subscription_status === 'free'` ET `user.free_predictions_used >= 2`.
- Contenu de `<PredictionContent />` est rendu mais flouté (`blur-md`).
- `<PaywallOverlay />` est superposé.

---

### 5.3 `<StatsPanel />`

**Panneau latéral (desktop) ou section scrollable (mobile) avec les données brutes.**

#### 5.3.1 `<FormChart />`

| Composant | Détail |
|---|---|
| Type | Bar chart horizontal ou série de badges |
| Données | 5 derniers matchs de chaque équipe |
| Format | V (vert) / N (gris) / D (rouge) pour chaque match |
| Librairie | Chart.js léger ou composant SVG custom |

#### 5.3.2 `<H2HHistory />`

| Composant | Détail |
|---|---|
| Type | Liste des 5 dernières confrontations directes |
| Par ligne | Date + Score + Compétition |
| Résumé | "Arsenal : 3 victoires · Nuls : 1 · Chelsea : 1 victoire" |

#### 5.3.3 `<StandingsWidget />`

| Composant | Détail |
|---|---|
| Type | Mini-tableau de classement (5 lignes : 2 au-dessus, l'équipe, 2 en dessous) |
| Colonnes | Position, Équipe, Pts, J, V, N, D |
| Highlight | Ligne de chaque équipe du match surlignée |

#### 5.3.4 `<TeamStatsComparison />`

| Composant | Détail |
|---|---|
| Type | Barres horizontales comparatives face-à-face |
| Stats | Buts marqués/encaissés, Possession moyenne, Tirs cadrés/match, Corners/match |
| Rendu | Barre bleue (Home) vs barre rouge (Away) |

---

### 5.4 Layout Responsive de la Page Match

- **Desktop (≥1280px)** : 2 colonnes — `<PredictionPanel />` (65%) | `<StatsPanel />` (35%).
- **Tablette (768-1279px)** : Colonne unique. PredictionPanel puis StatsPanel empilés.
- **Mobile (<768px)** : Colonne unique. MatchHeader compact (logos plus petits). Tabs scrollables. StatsPanel en sections dépliables (accordéon).

---

## 6. Page Pricing

**Route** : `/pricing`
**Objectif** : Conversion gratuit → payant.

### 6.1 `<PricingHeader />`

- Titre : "Choisissez votre plan"
- Sous-titre : "Accédez aux analyses IA les plus précises du marché"
- `<BillingToggle />` : Switch "Mensuel / Annuel" avec badge "-20%" sur Annuel.

### 6.2 `<PricingTable />`

2 ou 3 cartes côte à côte :

| Plan | Gratuit | Premium | Premium Annuel |
|---|---|---|---|
| Prix | 0€ | 9.99€/mois (1€ le 1er mois) | 95.88€/an (7.99€/mois) |
| Analyses/jour | 2 | Illimité | Illimité |
| Sports | Tous | Tous | Tous |
| Niveaux de risque | Safe uniquement | Safe + Value + Risky | Safe + Value + Risky |
| Stats détaillées | ❌ | ✅ | ✅ |
| Alertes match | ❌ | ✅ | ✅ |
| Support prioritaire | ❌ | ❌ | ✅ |
| **CTA** | "Commencer" | "Essayer pour 1€" (mis en avant) | "Économiser 20%" |

**Design** :
- La carte "Premium" est surélevée (`scale-105`, `ring-2 ring-blue-500`, badge "POPULAIRE").
- Chaque feature a une icône (✅ ou ❌).

### 6.3 `<PricingFAQ />`

Accordéon spécifique au pricing :
1. "Puis-je annuler à tout moment ?"
2. "Comment fonctionne l'offre à 1€ ?"
3. "Quels moyens de paiement acceptez-vous ?"
4. "Y a-t-il un engagement ?"

### 6.4 `<MoneyBackGuarantee />`

Badge/Bandeau : "Satisfait ou remboursé pendant 14 jours. Sans question."

---

## 7. Page Profil Utilisateur

**Route** : `/dashboard/profile`
**Objectif** : Gestion du compte et de l'abonnement.

### 7.1 `<ProfileHeader />`

| Composant | Détail |
|---|---|
| `<Avatar />` | Photo de profil (ou initiales). Cliquable pour changer |
| `<UserInfo />` | Nom, Email, Date d'inscription |
| `<SubscriptionBadge />` | "Gratuit" (gris) ou "Premium" (bleu gradient) ou "Premium Annuel" (or gradient) |

### 7.2 `<SubscriptionCard />`

| Composant | Détail |
|---|---|
| Statut actuel | "Premium — Actif jusqu'au 11 Mars 2026" |
| Bouton "Gérer l'abonnement" | Redirige vers le Stripe Customer Portal |
| Bouton "Changer de plan" | → URL `/pricing` |
| Historique des paiements | Liste des 5 derniers paiements (date, montant, statut) |

### 7.3 `<PreferencesForm />`

| Champ | Type | Détail |
|---|---|---|
| Sports favoris | Checkbox group | ⚽🏀🎾 — Définit le filtre par défaut du Dashboard |
| Ligues favorites | Multi-select dropdown | Ligues affichées en priorité |
| Langue | Select | FR / EN (MVP : FR uniquement) |
| Notifications email | Toggle switch | Activer/désactiver les résumés quotidiens |

### 7.4 `<DangerZone />`

- Bouton "Se déconnecter" (Secondary).
- Bouton "Supprimer mon compte" (Red, avec modal de confirmation double : "Êtes-vous sûr ? Cette action est irréversible.").

---

## 8. États Transversaux

### 8.1 États d'Authentification

| État | Comportement |
|---|---|
| `anonymous` | Accès à : Landing, Pricing, Login, Signup. Dashboard redirige vers Login |
| `authenticated_free` | Accès complet au Dashboard. Prédictions limitées à 2/jour. PaywallOverlay au 3ème |
| `authenticated_premium` | Accès complet à tout. Pas de PaywallOverlay. Badge "PRO" dans UserMenu |
| `authenticated_admin` | Accès à tout + Vue Admin (`/admin/*`). Badge "ADMIN" dans UserMenu. Lien "Tour de Contrôle" dans le dropdown |
| `session_expired` | Toast "Votre session a expiré" + redirect Login |

### 8.2 États de Chargement

| Page/Composant | Loading State |
|---|---|
| Dashboard | Skeleton grid (6 cartes skeleton) |
| MatchCard | Skeleton card individuelle |
| PredictionPanel | Skeleton texte (8 lignes) + skeleton gauge |
| StatsPanel | Skeleton barres + skeleton tableau |

### 8.3 États d'Erreur

| Erreur | Composant | Comportement |
|---|---|---|
| API Backend down | `<ErrorBanner />` | Bandeau rouge en haut : "Service temporairement indisponible. Réessayez dans quelques instants." + bouton "Réessayer" |
| Match introuvable | `<NotFoundPage />` | "Ce match n'existe pas ou n'est plus disponible." + lien retour Dashboard |
| Erreur réseau | `<OfflineNotice />` | Toast warning "Connexion perdue. Vérifiez votre réseau." |

---

## 9. Parcours Utilisateurs Détaillés

### 9.1 Parcours "Découverte → Conversion" (Nouveau Visiteur)

```
Landing Page
  → Scroll → Voit le DemoPredictor widget
  → Clique "📊 Voir l'analyse complète"
  → [Si non connecté] Redirect → /signup
  → Remplit le formulaire → Crée son compte
  → /onboarding (3 étapes : Sports, Profil, Go!)
  → /dashboard (filtré sur ses sports favoris)
  → Clique sur un MatchCard → /dashboard/match/[id]
  → Voit la prédiction Safe complète (1ère analyse gratuite)
  → Retour Dashboard → Clique sur un 2ème match
  → Voit la prédiction (2ème analyse gratuite)
  → Retour Dashboard → Clique sur un 3ème match
  → ⚠️ PaywallOverlay s'affiche sur la PredictionPanel
  → Toast warning "Dernière analyse gratuite utilisée"
  → Clique "Passer Premium" → Stripe Checkout (1€)
  → Retour /dashboard → Toast success "Bienvenue en Premium ! 🎉"
  → Toutes les analyses sont maintenant accessibles
```

### 9.2 Parcours "Usage Quotidien" (Abonné Premium)

```
Ouvre l'app (session persistante, pas de login)
  → /dashboard affiché avec son sport favori (ex: Tennis)
  → Scan rapide des MatchCards
  → Repère un badge "🟢 Safe 89%"
  → Clique → /dashboard/match/[id]
  → Lit l'analyse Safe en 30 secondes
  → Switch vers onglet "🟡 Value" pour comparer
  → Consulte les stats H2H et la forme récente
  → Prend sa décision (hors plateforme)
  → Retour Dashboard pour le prochain match
```

### 9.3 Parcours "Gestion Abonnement"

```
Dashboard → UserMenu → "Mon profil"
  → /dashboard/profile
  → Voit le statut "Premium — Actif"
  → Clique "Gérer l'abonnement"
  → [Redirect Stripe Customer Portal]
  → Peut : changer de carte, passer annuel, annuler
  → Retour sur BETIX
```

---

---

# 🛡️ VUE ADMIN — Tour de Contrôle

> L'Admin Panel est un espace séparé (`/admin/*`) accessible uniquement aux utilisateurs avec le rôle `admin`. Il offre une **mainmise totale** sur l'application sans nécessiter de compétences techniques. C'est la tour de contrôle du gestionnaire.

---

## 10. Admin — Layout & Navigation

**Route de base** : `/admin`
**Accès** : `user.role === 'admin'` uniquement. Tout autre utilisateur est redirigé vers `/dashboard` avec un toast erreur.

### 10.1 `<AdminLayout />`

**Structure** : Sidebar fixe (gauche) + Contenu principal (droite) + Header top.
C'est un layout complètement différent de la vue utilisateur.

```
┌───────────┬──────────────────────────────────────────┐
│           │  🔔 3   Admin Betix        👤 Admin ▼   │ ← AdminHeader
│  BETIX    ├──────────────────────────────────────────┤
│  ADMIN    │                                          │
│           │                                          │
│  📊 Dashboard  │         Contenu Principal            │
│  👥 Utilisateurs│                                     │
│  💳 Abonnements│                                      │
│  ⚙️ Config     │                                      │
│  🔔 Notifications│                                    │
│           │                                          │
│  ─────    │                                          │
│  ↩️ Retour App │                                      │
└───────────┴──────────────────────────────────────────┘
```

### 10.2 `<AdminSidebar />`

| Élément | Icône | Route | Description |
|---|---|---|---|
| Dashboard | 📊 | `/admin` | Vue d'ensemble KPIs |
| Utilisateurs | 👥 | `/admin/users` | CRUD utilisateurs |
| Abonnements | 💳 | `/admin/subscriptions` | Gestion plans & revenus |
| Configuration | ⚙️ | `/admin/settings` | Clés API, paramètres système |
| Notifications | 🔔 | `/admin/notifications` | Centre de notifications |
| Séparateur | — | — | Ligne de séparation visuelle |
| Retour à l'app | ↩️ | `/dashboard` | Lien vers la vue utilisateur |

**Comportement** :
- L'élément actif a un fond `bg-blue-600/20` + bordure gauche bleue.
- Le badge de notification (🔔 3) affiche le nombre de notifications non lues.
- **Responsive Mobile** : La sidebar se transforme en menu bottom (comme une app mobile) ou en drawer (slide-in depuis la gauche).

### 10.3 `<AdminHeader />`

| Composant | Détail |
|---|---|
| `<AdminBreadcrumb />` | Fil d'Ariane : "Admin > Utilisateurs > Détail" |
| `<NotificationBell />` | Icône cloche avec badge compteur. Clic → Dropdown des 5 dernières notifications |
| `<AdminUserMenu />` | Nom admin + Dropdown (Mon Profil, Retour App, Déconnexion) |

---

## 11. Admin — Dashboard Analytics

**Route** : `/admin`
**Objectif** : Vue d'ensemble instantanée de la santé de l'application.
**Layout** : Grille Bento avec des widgets de tailles variées.

### 11.1 `<KPIRow />` (Ligne de KPIs principaux)

4 cartes KPI en ligne, chacune montrant une métrique clé :

| KPI Card | Donnée | Icône | Couleur | Détail |
|---|---|---|---|---|
| `<KPICard title="Utilisateurs">` | Total utilisateurs inscrits | 👥 | Blue | Sous-texte : "+12 cette semaine" (tendance). Flèche ↑ verte ou ↓ rouge |
| `<KPICard title="Abonnés Actifs">` | Nombre d'abonnés premium | 💳 | Emerald | Sous-texte : Taux de conversion (ex: "8.2%"). Évolution vs mois précédent |
| `<KPICard title="Revenus du Mois">` | MRR (Monthly Recurring Revenue) | 💰 | Amber | Sous-texte : "vs. mois dernier +15%". Montant en euros |
| `<KPICard title="Prédictions Générées">` | Total prédictions IA du jour | 🧠 | Indigo | Sous-texte : "42 aujourd'hui". Moyenne quotidienne |

**Structure d'un `<KPICard />`** :
```
┌────────────────────┐
│ 👥 Utilisateurs    │
│                    │
│    1,247           │ ← Valeur principale (text-3xl font-bold)
│    ↑ +12 (0.9%)    │ ← Tendance (vert si positif, rouge si négatif)
│    cette semaine    │ ← Période (text-xs text-slate-500)
└────────────────────┘
```

### 11.2 `<RevenueChart />`

| Composant | Détail |
|---|---|
| Type | Line chart ou Area chart |
| Données | Revenus mensuels (12 derniers mois) |
| Axes | X : Mois, Y : Montant (€) |
| Toggle | Filtre période : "7j / 30j / 90j / 12 mois" |
| Taille | Grande carte (occupe 2/3 de la largeur sur desktop) |
| Librairie | Recharts ou Chart.js |

### 11.3 `<UserGrowthChart />`

| Composant | Détail |
|---|---|
| Type | Bar chart empilé ou Line chart |
| Données | Inscriptions par jour/semaine |
| Segments | Free vs Premium (2 couleurs) |
| Toggle | Filtre période : "7j / 30j / 90j" |
| Taille | Carte medium (1/3 de la largeur) |

### 11.4 `<PredictionUsageChart />`

| Composant | Détail |
|---|---|
| Type | Donut chart ou Pie chart |
| Données | Répartition par sport (Football / Basketball / Tennis) |
| Sous-données | Nombre total de prédictions par sport |
| Taille | Carte medium |

### 11.5 `<RecentActivityFeed />`

Flux d'activité en temps réel (liste scrollable) :

| Type d'événement | Icône | Exemple |
|---|---|---|
| Inscription | 🆕 | "Jean Dupont s'est inscrit il y a 5 min" |
| Abonnement | 💳 | "Marie L. est passée Premium — 9.99€" |
| Désabonnement | ❌ | "Pierre M. a annulé son abonnement" |
| Prédiction | 🧠 | "56 prédictions générées pour la Ligue 1" |
| Erreur système | ⚠️ | "API-Sports : Quota à 80% — Attention" |

**Comportement** : Scroll infini, les 20 derniers événements affichés. Clic sur un événement utilisateur → redirige vers la fiche utilisateur.

### 11.6 `<SystemHealthWidget />`

| Composant | Détail |
|---|---|
| Statut Backend | 🟢 "En ligne" ou 🔴 "Hors ligne" — Ping automatique toutes les 60s |
| Statut API-Sports | 🟢/🟡/🔴 + Quota consommé (ex: "245/500 requêtes") |
| Statut Gemini API | 🟢/🟡/🔴 + Requêtes du jour |
| Statut Stripe | 🟢/🟡/🔴 + Dernière transaction réussie |
| Statut Supabase | 🟢/🟡/🔴 + Espace DB utilisé |

---

## 12. Admin — Gestion Utilisateurs

**Route** : `/admin/users`
**Objectif** : CRUD complet sur les utilisateurs. Vision individuelle et globale.

### 12.1 `<UsersHeader />`

| Composant | Détail |
|---|---|
| Titre | "Gestion des Utilisateurs" |
| `<SearchBar />` | Recherche par nom, email ou ID. Recherche en temps réel (debounced 300ms) |
| `<FilterDropdown />` | Filtres : Statut (Free / Premium / Annulé) · Sport favori · Date d'inscription |
| `<Button variant="primary">` | "+ Ajouter un utilisateur" → Ouvre `<CreateUserModal />` |

### 12.2 `<UsersTable />`

Tableau avec colonnes triables et pagination.

| Colonne | Donnée | Triable | Détail |
|---|---|---|---|
| Avatar + Nom | `user.name` | Oui | Avatar 32px + nom cliquable (→ fiche détail) |
| Email | `user.email` | Oui | Texte tronqué si trop long |
| Statut | `user.subscription_status` | Oui | Badge coloré : "Free" (gris), "Premium" (bleu), "Annulé" (rouge) |
| Inscrit le | `user.created_at` | Oui | Date formatée (ex: "11 Fév 2026") |
| Analyses consultées | `user.predictions_viewed` | Oui | Nombre total |
| Actions | — | Non | Menu "⋯" : Voir profil · Modifier · Suspendre · Supprimer |

**Pagination** : 20 utilisateurs par page. Navigation "← 1 2 3 ... 12 →".
**État vide** : "Aucun utilisateur trouvé pour cette recherche."

### 12.3 `<UserDetailPanel />` (Slide-in ou Page dédiée)

**Route** : `/admin/users/[id]`
Affiche le profil complet d'un utilisateur avec toutes les actions possibles.

#### Structure :

| Section | Composants | Détail |
|---|---|---|
| **Header** | `<Avatar />` + Nom + Email + Badge statut | Grande vue du profil |
| **Infos Compte** | `<InfoGrid />` | ID, Date inscription, Dernière connexion, IP, User Agent |
| **Abonnement** | `<SubscriptionSummary />` | Plan actuel, Date début/fin, ID Stripe, Historique paiements |
| **Activité** | `<UserActivityLog />` | 10 dernières actions (connexions, prédictions consultées, paiements) |
| **Préférences** | `<UserPreferences />` | Sports favoris, Ligues favorites, Langue |
| **Actions Admin** | `<AdminActions />` | Boutons d'action (voir ci-dessous) |

#### Actions Admin disponibles :

| Action | Bouton | Effet | Confirmation |
|---|---|---|---|
| Modifier le profil | Icône ✏️ | Ouvre un formulaire inline éditable (nom, email) | Non |
| Changer le plan | `<Select>` | Dropdown : Free / Premium / Premium Annuel | Modal : "Confirmer le changement de plan ?" |
| Offrir du Premium | Bouton 🎁 | Attribue X jours de Premium gratuit | Modal : Input nombre de jours |
| Réinitialiser MDP | Bouton 🔑 | Envoie un email de reset au user | Modal : "Un email sera envoyé." |
| Suspendre le compte | Bouton ⏸️ | Désactive temporairement l'accès | Modal : "Raison de la suspension ?" + Textarea |
| Supprimer le compte | Bouton 🗑️ (Danger) | Suppression définitive avec cascade en BDD | **Double confirmation** : "Tapez SUPPRIMER pour confirmer" |

### 12.4 `<CreateUserModal />`

Pour créer un utilisateur manuellement (cas : partenaire, testeur, VIP).

| Champ | Type | Requis | Détail |
|---|---|---|---|
| Nom complet | Text | Oui | — |
| Email | Email | Oui | Vérifie unicité en temps réel |
| Mot de passe | Password | Oui | Généré automatiquement avec bouton "Copier" OU saisi manuellement |
| Rôle | Select | Oui | "Utilisateur" ou "Admin" |
| Plan initial | Select | Oui | Free / Premium / Premium Annuel |
| Envoyer email de bienvenue | Toggle | Non | Si activé, envoie un email avec les identifiants |

---

## 13. Admin — Gestion Abonnements & Revenus

**Route** : `/admin/subscriptions`
**Objectif** : Piloter la stratégie de monétisation et suivre les revenus.

### 13.1 `<SubscriptionKPIs />`

| KPI | Donnée | Détail |
|---|---|---|
| MRR | Monthly Recurring Revenue | Montant total des abonnements actifs ce mois |
| Churn Rate | Taux d'annulation | % d'abonnés qui annulent ce mois vs mois dernier |
| ARPU | Average Revenue Per User | Revenu moyen par utilisateur payant |
| Conversion Rate | Free → Premium | % d'inscrits gratuits qui passent Premium |

### 13.2 `<PlansManager />`

Tableau éditable des plans d'abonnement.

| Colonne | Donnée | Éditable | Détail |
|---|---|---|---|
| Nom du plan | "Premium Mensuel" | Oui (inline) | Clic pour modifier le libellé |
| Prix | 9.99€/mois | Oui (inline) | Modifier le prix. **Attention** : ne modifie que l'affichage, le prix Stripe est master |
| Promo 1er mois | 1.00€ | Oui (inline) | Montant de l'offre d'appel |
| Stripe Price ID | `price_xxx` | Lecture seule | ID Stripe associé. Copier au clic |
| Abonnés actifs | 142 | Lecture seule | Nombre d'abonnés sur ce plan |
| Statut | Actif / Inactif | Oui (Toggle) | Désactiver un plan empêche les nouvelles souscriptions |

**Actions** :
- Bouton "Créer un nouveau plan" : Ouvre un formulaire pour définir un nouveau plan Stripe.

### 13.3 `<SubscriptionsTable />`

Liste de tous les abonnements individuels.

| Colonne | Donnée | Détail |
|---|---|---|
| Utilisateur | Nom + Email | Lien vers fiche utilisateur |
| Plan | Premium / Annuel | Badge coloré |
| Statut | Active / Past Due / Cancelled / Trialing | Badge avec couleur sémantique |
| Depuis | Date de début | — |
| Prochain paiement | Date | Avec montant attendu |
| Actions | — | Voir sur Stripe (lien externe) · Annuler · Offrir extension |

### 13.4 `<RevenueBreakdownChart />`

Graphique des revenus ventilé par plan (Mensuel vs Annuel) sur les 12 derniers mois. Stacked bar chart.

---

## 14. Admin — Configuration Système

**Route** : `/admin/settings`
**Objectif** : Donner au gestionnaire la mainmise sur les paramètres techniques sans toucher au code.

### 14.1 `<SettingsTabs />`

La page est organisée en **onglets** pour regrouper les paramètres par catégorie.

| Onglet | Label | Contenu |
|---|---|---|
| API Keys | 🔑 Clés API | Configuration des fournisseurs de données |
| IA | 🧠 Intelligence Artificielle | Paramètres du moteur de prédiction |
| App | 📱 Application | Paramètres généraux de l'app |
| Maintenance | 🔧 Maintenance | Mode maintenance, réinitialisation cache |

### 14.2 Onglet "Clés API" (`<APIKeysSettings />`)

| Champ | Type | Masqué | Détail |
|---|---|---|---|
| API-Sports Key | Text (password-like) | Oui (•••••) | Bouton "Afficher" pour toggle. Bouton "Tester" pour vérifier la validité |
| API-Tennis Key | Text (password-like) | Oui | Idem. Avec indicateur de statut (🟢 Valide / 🔴 Invalide) |
| Gemini API Key | Text (password-like) | Oui | Idem |
| Stripe Secret Key | Text (password-like) | Oui | Idem. **Warning** affiché : "Ne modifiez que si vous savez ce que vous faites" |
| Stripe Webhook Secret | Text (password-like) | Oui | Idem |
| Supabase URL | Text | Non | URL du projet Supabase |
| Supabase Service Key | Text (password-like) | Oui | Clé service (admin) |

**Bouton "Sauvegarder"** : Sauvegarde toutes les clés modifiées. Toast success/error.
**Bouton "Tester toutes les connexions"** : Lance un test de connectivité sur chaque API et affiche un rapport (🟢🟢🔴🟢🟢).

### 14.3 Onglet "Intelligence Artificielle" (`<AISettings />`)

| Paramètre | Type | Détail |
|---|---|---|
| Modèle IA actif | Select | "Gemini 2.0 Flash" / "Gemini Pro" / "GPT-4o" (pour le futur) |
| Température | Slider (0-1) | Contrôle la créativité de l'IA. Default: 0.3 (factuel). Tooltip explicatif |
| Max tokens | Number input | Longueur max de l'analyse générée. Default: 1500 |
| Cache durée | Number input (minutes) | Durée de vie du cache des prédictions. Default: 120min |
| Prompt preview | Textarea (lecture seule) | Aperçu du prompt actuel (informatif, la modification se fait dans le code) |

### 14.4 Onglet "Application" (`<AppSettings />`)

| Paramètre | Type | Détail |
|---|---|---|
| Nom de l'app | Text | "BETIX" — Modifiable (affiché dans le titre du site) |
| Analyses gratuites/jour | Number (0-10) | Nombre de prédictions offertes aux Free Users. Default: 2 |
| Sports activés | Checkbox group | ⚽🏀🎾 — Permet de désactiver temporairement un sport |
| Mode inscription | Select | "Ouvert" / "Sur invitation" / "Fermé" |
| Message d'accueil | Textarea | Message personnalisé affiché sur le Dashboard (optionnel, ex: "Bienvenue sur BETIX !" ou promo du moment) |
| Email support | Email input | Adresse email affichée dans le footer et les pages d'aide |

### 14.5 Onglet "Maintenance" (`<MaintenanceSettings />`)

| Action | Bouton | Effet | Confirmation |
|---|---|---|---|
| Mode maintenance | Toggle ON/OFF | Active une page "Maintenance en cours" pour tous les utilisateurs. Seul l'admin peut naviguer | Modal : "Les utilisateurs ne pourront plus accéder à l'app." |
| Vider le cache matchs | Bouton 🗑️ | Supprime toutes les données en cache et force un re-fetch | Modal : "Cette action va supprimer X matchs en cache." |
| Vider le cache prédictions | Bouton 🗑️ | Supprime toutes les prédictions et force une régénération IA | Modal : "X prédictions seront supprimées." |
| Régénérer toutes les prédictions | Bouton 🔄 | Lance la régénération IA pour tous les matchs du jour | Modal : "Cela consommera du quota API. Continuer ?" + Progress bar |
| Exporter les données | Bouton 📥 | Exporte les utilisateurs + abonnements en CSV/JSON | Choix du format + Téléchargement automatique |

---

## 15. Admin — Centre de Notifications

**Route** : `/admin/notifications`
**Objectif** : Centraliser toutes les alertes système et les messages des utilisateurs.

### 15.1 `<NotificationTabs />`

| Onglet | Label | Contenu |
|---|---|---|
| Système | 🖥️ Système | Alertes automatiques générées par l'application |
| Utilisateurs | 👤 Utilisateurs | Messages/demandes envoyés par les utilisateurs |
| Historique | 📜 Historique | Toutes les notifications passées (archivées) |

### 15.2 Notifications Système (`<SystemNotifications />`)

Alertes automatiques générées par la plateforme :

| Type | Sévérité | Exemple | Action possible |
|---|---|---|---|
| Quota API proche | ⚠️ Warning | "API-Sports : 450/500 requêtes utilisées aujourd'hui" | Lien → Settings > API Keys |
| Quota API dépassé | 🔴 Critical | "API-Sports : Quota épuisé. Plus de données nouvelles jusqu'à demain" | Lien → Settings > API Keys |
| Erreur IA | 🔴 Critical | "Gemini API : Erreur 429 (Rate Limit) depuis 10 min" | Lien → Settings > IA |
| Stripe échoué | 🔴 Critical | "Paiement échoué pour user@email.com — Carte expirée" | Lien → Fiche utilisateur |
| Pic d'inscriptions | ℹ️ Info | "+42 inscriptions en 1h (moyenne : 5/h)" | Lien → Dashboard Analytics |
| Nouvel abonnement | ✅ Success | "Marie L. est passée Premium (9.99€)" | Lien → Fiche utilisateur |
| Désabonnement | ⚠️ Warning | "Pierre M. a annulé son abonnement" | Lien → Fiche utilisateur |

**Chaque notification** a :
- Badge de sévérité (couleur).
- Timestamp ("Il y a 5 min").
- Bouton "Marquer comme lu" (icône checkmark).
- Bouton action contextuelle (Lien vers la page concernée).

### 15.3 Notifications Utilisateurs (`<UserNotifications />`)

Messages envoyés par les utilisateurs via un futur formulaire de contact ou système de ticket.

| Champ | Détail |
|---|---|
| Expéditeur | Nom + Email (lien vers fiche user) |
| Sujet | Texte court |
| Message | Texte complet (expandable) |
| Date | Timestamp |
| Statut | "Nouveau" (bleu) / "Lu" (gris) / "Répondu" (vert) |
| Actions | "Répondre par email" (ouvre le client mail) · "Marquer comme lu" · "Archiver" |

### 15.4 `<NotificationPreferences />` (Alertes Admin)

L'admin peut configurer quelles alertes il souhaite recevoir et comment :

| Paramètre | Type | Détail |
|---|---|---|
| Alertes critiques par email | Toggle | Reçoit un email pour les alertes 🔴 Critical |
| Résumé quotidien | Toggle | Reçoit un récapitulatif chaque matin (nouveaux users, revenus, erreurs) |
| Alertes temps réel (in-app) | Toggle | Notifications push dans le navigateur |

---

## 16. Admin — Parcours Admin Détaillés

### 16.1 Parcours "Check Quotidien" (Routine Admin)

```
Connexion → /admin (Dashboard Analytics)
  → Scan des 4 KPIs (Users, Abonnés, Revenus, Prédictions)
  → Vérifie le SystemHealthWidget (toutes les APIs 🟢 ?)
  → Parcourt le RecentActivityFeed (nouvelles inscriptions, paiements)
  → Si notification 🔴 → Clique pour investiguer
  → Retour → Clique "↩️ Retour App" pour utiliser l'app normalement
```

### 16.2 Parcours "Gérer un Utilisateur Problématique"

```
/admin/notifications → Voit une plainte utilisateur
  → Clique sur le nom de l'expéditeur → /admin/users/[id]
  → Consulte l'historique d'activité
  → Décision : Offrir 7 jours Premium gratuit (bouton 🎁)
  → Ou : Suspendre le compte (bouton ⏸️ + raison)
  → Retour notifications → Marque comme "Répondu"
```

### 16.3 Parcours "Configurer une Nouvelle Clé API"

```
/admin/settings → Onglet "Clés API"
  → Clique "Afficher" sur API-Sports Key
  → Remplace par la nouvelle clé
  → Clique "Tester" → Résultat 🟢 "Connexion réussie"
  → Clique "Sauvegarder"
  → Toast success "Configuration mise à jour"
```

### 16.4 Parcours "Ajuster l'Offre Commerciale"

```
/admin/subscriptions → PlansManager
  → Modifie le prix promo 1er mois de 1€ à 0€ (offre gratuite)
  → Modifie le nombre d'analyses gratuites de 2 à 3
    → /admin/settings → Onglet App → Change "Analyses gratuites/jour" à 3
  → Sauvegarder
  → Les changements sont immédiatement reflétés côté utilisateur
```

---

## 17. Inventaire Complet des Composants React

### 17.1 Composants UI Génériques (`/components/ui/`)

| Composant | Props Clés | Description |
|---|---|---|
| `Button` | `variant`, `size`, `loading`, `disabled` | Primary, Secondary, Ghost, Danger |
| `Input` | `label`, `type`, `error`, `helper` | Champ de formulaire avec label et validation |
| `Badge` | `variant`, `size` | Safe, Warning, Danger, Live, Pro, Admin |
| `Card` | `interactive`, `loading` | Container avec border et hover |
| `Tabs` | `items`, `activeTab`, `onChange` | Tabs horizontaux |
| `Accordion` | `items` | FAQ dépliable |
| `Modal` | `open`, `onClose`, `title` | Dialogue modal |
| `Toast` | `type`, `message`, `duration` | Notification éphémère |
| `Gauge` | `value`, `max`, `color` | Jauge circulaire SVG |
| `Skeleton` | `variant` | Placeholder animé |
| `Avatar` | `src`, `name`, `size` | Photo ou initiales |
| `Toggle` | `checked`, `onChange` | Switch on/off |
| `Dropdown` | `options`, `value`, `onChange` | Menu déroulant |
| `ProgressBar` | `value`, `max` | Barre de progression |
| `Table` | `columns`, `data`, `sortable`, `pagination` | Tableau avec tri et pagination |
| `SearchBar` | `placeholder`, `onChange`, `debounce` | Barre de recherche avec debounce |
| `Breadcrumb` | `items` | Fil d'Ariane |
| `Slider` | `min`, `max`, `step`, `value` | Curseur glissant |

### 17.2 Composants Métier — Vue Utilisateur (`/components/dashboard/`)

| Composant | Description |
|---|---|
| `MatchCard` | Carte match (Dashboard grid) |
| `MatchHeader` | En-tête match (Page détail) |
| `PredictionPanel` | Panneau prédiction (Tabs + Contenu) |
| `RiskTabs` | Onglets Safe/Value/Risky |
| `PredictionContent` | Contenu d'une prédiction |
| `ConfidenceGauge` | Jauge de confiance |
| `KeyFactors` | Liste des facteurs clés |
| `FormChart` | Graphique de forme |
| `H2HHistory` | Historique confrontations |
| `StandingsWidget` | Mini-classement |
| `TeamStatsComparison` | Barres comparatives |
| `PaywallOverlay` | Blocage premium |
| `SportTabs` | Filtres sport |
| `LeagueFilter` | Filtres ligue |
| `MatchGrid` | Grille de matchs |
| `EmptyState` | État vide |
| `DemoPredictor` | Widget démo landing |

### 17.3 Composants Landing (`/components/landing/`)

| Composant | Description |
|---|---|
| `HeroSection` | Section hero avec CTA |
| `HowItWorks` | Section 3 étapes |
| `SportShowcaseCard` | Carte sport |
| `TestimonialCard` | Carte témoignage |
| `PricingPreview` | Aperçu tarifs |
| `AccordionFAQ` | FAQ dépliable |
| `CTABanner` | Bandeau CTA final |

### 17.4 Composants Auth (`/components/auth/`)

| Composant | Description |
|---|---|
| `AuthForm` | Formulaire login/signup réutilisable |
| `OAuthButton` | Bouton connexion sociale |
| `PasswordStrength` | Indicateur force mot de passe |
| `OnboardingStepper` | Stepper d'onboarding |
| `SportSelectionGrid` | Grille sélection sports |

### 17.5 Composants Admin (`/components/admin/`)

| Composant | Description |
|---|---|
| `AdminLayout` | Layout sidebar + contenu |
| `AdminSidebar` | Navigation latérale admin |
| `AdminHeader` | Header avec breadcrumb + notification bell |
| `KPICard` | Carte métrique avec tendance |
| `RevenueChart` | Graphique revenus (Line/Area) |
| `UserGrowthChart` | Graphique croissance utilisateurs |
| `PredictionUsageChart` | Donut répartition par sport |
| `RecentActivityFeed` | Flux d'activité en temps réel |
| `SystemHealthWidget` | Statut de santé des services |
| `UsersTable` | Tableau CRUD utilisateurs |
| `UserDetailPanel` | Fiche détaillée d'un utilisateur |
| `CreateUserModal` | Modal création utilisateur |
| `PlansManager` | Tableau éditable des plans |
| `SubscriptionsTable` | Liste des abonnements individuels |
| `APIKeysSettings` | Formulaire clés API |
| `AISettings` | Paramètres moteur IA |
| `AppSettings` | Paramètres généraux |
| `MaintenanceSettings` | Actions de maintenance |
| `NotificationCenter` | Centre de notifications (système + users) |
| `NotificationPreferences` | Préférences d'alertes admin |
