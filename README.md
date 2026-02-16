# BETIX - AI-Powered Sports Betting SaaS

![BETIX Logo](frontend/src/app/icon.png)

**BETIX** is a premium SaaS platform offering AI-driven sports predictions for Football, Basketball, and Tennis. Built with a modern tech stack, it provides real-time insights, deep analytics, and a gamified user experience.

## 🚀 Technos Principales

-   **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/UI, Framer Motion.
-   **Backend**: Python, FastAPI, Supabase (PostgreSQL), Docker.
-   **AI Engine**: Custom predictive models for match outcomes and confidence scoring.
-   **Infrastructure**: Docker Compose for easy orchestration.

## 🛠️ Installation & Démarrage

### Pré-requis
-   Docker Desktop installé.
-   Node.js 20+ (pour le dev local).
-   Python 3.11+ (pour le dev local).

### Lancement Rapide (Docker)

Le projet est entièrement conteneurisé. Pour lancer l'application :

```bash
docker-compose up -d --build
```

L'application sera accessible sur :
-   **Frontend** : [http://localhost:3000](http://localhost:3000)
-   **Backend API** : [http://localhost:8000](http://localhost:8000)
-   **Orchestrator** : Service d'arrière-plan pour l'automatisation.

## ✨ Fonctionnalités Clés

-   **Dashboard Interactif** : Vue d'ensemble des matchs en direct, à venir et terminés.
-   **Analyse IA** : "Confidence Gauge" et facteurs clés pour chaque pronostic.
-   **Live Score** : Suivi en temps réel des scores et du temps de jeu (Minutes pour Football, Quart-temps pour Basket).
-   **Gamification** : Système de niveaux, badges (Rookie, Pro, Elite, Legend) et XP pour les utilisateurs.
-   **Branding** : Interface sombre, moderne et épurée ("Glassmorphism").

## 📂 Structure du Projet

-   `/frontend` : Application Next.js.
-   `/backend` : API Python et scripts d'ingestion.
-   `/scripts` : Outils de maintenance et de migration.

## 🤝 Contribution

1.  Forker le projet.
2.  Créer une branche (`git checkout -b feature/AmazingFeature`).
3.  Commit vos changements (`git commit -m 'Add some AmazingFeature'`).
4.  Push sur la branche (`git push origin feature/AmazingFeature`).
5.  Ouvrir une Pull Request.

---
*Propulsé par Kaizen D & AI Dev.*
