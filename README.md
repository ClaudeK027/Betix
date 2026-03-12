<div align="center">
  <img src="https://via.placeholder.com/150/000000/FFFFFF/?text=BETIX" alt="Betix Logo" />
  <h1>BETIX AI 📈</h1>
  <p><strong>Plateforme Premium d'Analyse et de Pronostics Sportifs (IA)</strong></p>
</div>

---

## 📖 Introduction

**BETIX** est une application SaaS full-stack conçue pour redéfinir l'approche analytique des paris sportifs professionnels (Football, Basketball, Tennis). Le système ingère des bataillons de données statistiques complexes (Rolling Form, xG, Net Rating, H2H) en temps réel, les consolide, et délègue l'analyse brute à des Modèles de Langage (LLM - Anthropic/Gemini) pour fournir un Indice de Confiance et une narration humaine ("Expert Opinion") aux parieurs.

L'architecture est scindée en deux écosystèmes bien distincts, conçus pour la performance et la fiabilité asynchrone.

---

## 🏗️ Architecture Globale (Le Monorepo)

Le dépôt contient deux composants majeurs, vivant de manière autonome et communiquant via la base de données (Supabase).

### 1. 🖥️ Le Frontend (Next.js)
Situé dans `/frontend`. C'est le portail utilisateur SaaS (Dashboard, Paywall).
- **Stack** : Next.js 15 (App Router), React, Tailwind CSS, Shadcn UI.
- **Rôle** : Servir la Landing Page ultra-optimisée SEO, gérer l'authentification MFA via Supabase, traiter les paiements avec Stripe, et restituer l'analyse IA via une interface (UI) premium et interactive.
- **Philosophie** : Data Fetching sévère côté serveur (Server Components). Toute modification du flux d'accès (Premium Gate) se gère à la racine des layouts pour bloquer technétiquement la vue.
- **En savoir plus** : [Consulter la documentation dédiée Frontend](./frontend/README.md).

### 2. 🗄️ Le Backend / Moteur IA (Python)
Situé dans `/backend`. C'est l'usine à données (Ingestion, Radars, Intelligence Artificielle).
- **Stack** : Python 3.12+, FastAPI, Pydantic, httpx (Asynchrone).
- **Rôle** : Écouter l'horloge biologique des matchs de sport, déclencher les mises à jour "in-play" (Live), recalculer les statistiques avancées à la fin de chaque partie, et lancer l'orchestration des prompts IA quand les cotes ("odds") sont tombées.
- **Philosophie** : Multi-Workers asynchrones et unitaires, guidés par des Orchestrateurs (Data, Live, AI) orchestrés autour des tables Analytics de Supabase.
- **En savoir plus** : [Consulter la documentation dédiée Backend](./backend/README.md).

---

## 🧠 Infrastructure Données (Supabase)

Betix est intensément articulé autour de **Supabase** offrant la base de données PostgreSQL, l'Authentification (et gestion MFA), et les permissions.

### Côté Frontend
Le frontend s'appuie sur le *Role-Level Security (RLS)* et accède à la base de données via la clé publique anonyme pour garantir la sécurité fine par usager.

### Côté Backend
Le backend tourne en *System Administrator* (clé de service / `service_role_key`).
Le backend sépare ses calculs en deux schémas de base de données :
- `public` : La projection de ce qui doit être lu par les utilisateurs (Matchs, Profils, IA Audits terminés).
- `analytics` : La "boîtes noire" où se gèrent les algorithmes (Historique Elo, Face-à-Face profonds, Cotes dynamiques pre-match). 

---

## 💳 Monétisation (Stripe)

La gestion des abonnements est centralisée de bout-en-bout :
- L'utilisateur final achète l'accès via Stripe Checkout (Routing Next.js).
- Le backend Supabase webhook écoute `POST /api/stripe/webhook`.
- À chaque récurrence d'abonnement, le webhook vérifie la signature Stripe, allonge la date d'échéance `current_period_end` dans la table des `subscriptions`, débloquant instantanément le Paywall Next.js (grâce aux abonnements Realtime/SSR Supabase).

---

## 🚀 Guide de Démarrage Rapide

### Pré-requis
- Node.js (v20+)
- Python (v3.12+)
- Une instance **Supabase** (URL et Clés).
- Des clés API (API-Sports, API-Tennis, Anthropic/Google Gemini, Stripe).

### 1️⃣ Lancement du Frontend
```bash
cd frontend
npm install
# Remplir le fichier .env (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, STRIPE_SECRET_KEY, etc.)
npm run dev
```

### 2️⃣ Lancement du Backend
```bash
cd backend
python -m venv venv
# Sur Windows : venv\Scripts\activate.ps1
# Sur Mac/Linux : source venv/bin/activate
pip install -r requirements.txt
# Remplir le fichier .env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, API_SPORTS_KEY, ANTHROPIC_API_KEY)
# Lancer le serveur d'API (Endpoint)
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*(Remarque : Notez qu'en production, le Backend a besoin de ses orchestrateurs tournant en parallèle pour que la donnée s'actualise — cf. Doc Backend).*

---

## 🛡️ Contributeurs et Support
Prière de se référer de façon impérative aux deux README sous-jacents (Frontend & Backend) avant tout Commit impactant l'intelligence analytique (Scripts d'ingestion/Rolling form) ou les passerelles MFA front-end.
