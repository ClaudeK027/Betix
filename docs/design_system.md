# 🎨 BETIX — Design System & Branding Guidelines

> **Vision** : Une interface "Premium Dark" immersive, inspirée des plateformes de trading haute fréquence et des tableaux de bord analytiques sportifs modernes. L'objectif est d'inspirer confiance, rapidité et expertise.

---

## 1. Identité Visuelle

### Palettes de Couleurs "Midnight Neon"

Une base sombre et profonde pour réduire la fatigue visuelle, contrastée par des accents néons vibrants pour la data-viz.

#### 🌑 Surfaces (Backgrounds)
Utilisation de niveaux de gris profonds (pas de noir pur) pour la hiérarchie.
- **Background Main** : `#0F172A` (Slate 900) — Fond principal de l'application.
- **Surface Card** : `#1E293B` (Slate 800) — Fond des cartes / Bento items.
- **Surface Overlay** : `#334155` (Slate 700) — Modales, Dropdowns.

#### ⚡ Brand Colors (Accents)
- **Primary (Betix Blue)** : `#3B82F6` (Blue 500) → Action principale, Liens, Logo.
- **Secondary (Deep Purple)** : `#6366F1` (Indigo 500) → Gradients, Premium features.

#### 📊 Semantic Colors (Data & Status)
- **Success / Win / Safe** : `#10B981` (Emerald 500) — Victoire, Prédiction sûre.
- **Warning / Draw / Medium** : `#F59E0B` (Amber 500) — Match nul, Risque modéré.
- **Danger / Loss / Risky** : `#EF4444` (Red 500) — Défaite, Risque élevé, Erreur.

---

## 2. Typographie

Police unique pour une cohérence maximale et une lisibilité optimale des chiffres.

**Font Family** : [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts)
- **Poids** : 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold).
- **Chiffres** : Utiliser `font-feature-settings: 'tnum'` (Tabular Numbers) pour l'alignement des scores et stats.

### Échelle Typographique
- **H1 (Page Title)** : `text-3xl` / Bold / Tracking-tight
- **H2 (Section Title)** : `text-xl` / SemiBold
- **H3 (Card Title)** : `text-lg` / Medium
- **Body** : `text-sm` / Regular / Slate-400
- **Data/Score** : `text-2xl` / Bold / Tracking-widest

---

## 3. Principes UI / UX

### 🍱 Bento Grid Layout
L'interface dashboard sera organisée en **grille modulaire (Bento)**.
- Chaque information (Match du jour, Stats, News) vit dans une "cellule" rectangulaire.
- Permet une densité d'information élevée sans surcharge.
- Responsive par nature (les blocs s'empilent sur mobile).

### 💎 Glassmorphism (Subtil)
Utilisé pour les headers sticky, les tooltips et les overlays.
- `backdrop-filter: blur(12px)`
- `bg-slate-900/80` (transparence)
- Bordure subtile : `border-white/10`

### 🔄 Micro-Interactions
- **Hover** : Légère élévation (`translate-y-[-2px]`) + Brillance (`ring-2 ring-primary/50`) sur les cartes interactives.
- **Feedback** : Ripple effect sur les boutons.

---

## 4. Bibliothèque de Composants (Tailwind Classes)

### Boutons
- **Primary** : `bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-all shadow-lg shadow-blue-500/20`
- **Secondary** : `bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 py-2 rounded-lg transition-all`
- **Ghost** : `text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors`

### Cartes (Bento Item)
- **Base** : `bg-slate-800 rounded-xl border border-slate-700/50 p-5`
- **Interactive** : `hover:border-blue-500/50 hover:bg-slate-800/80 cursor-pointer transition-all`

### Badges / Tags
- **Safe** : `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider`
- **Risky** : `bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider`
- **Live** : `bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse`

---

## 5. Intégration dans le Projet

### Fichiers à modifier
1.  **`tailwind.config.ts`** : Définir les couleurs personnalisées (`brand`, `surface`) et la font family.
2.  **`globals.css`** : Importer Inter, définir le background body global.
3.  **Components** : Créer `ui/Button.tsx`, `ui/Card.tsx`, `ui/Badge.tsx` en appliquant ces styles.
