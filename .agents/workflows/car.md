---
description: Méthode CAR (Cadrage - Assemblage - Réalisation) pour le développement de nouvelles fonctionnalités.
---

Cette méthode structurée est conçue pour la création de nouvelles fonctionnalités, garantissant une base solide et une intégration fluide dans l'existant.

### 📝 Phase 1 : Cadrage (L'Audit de Faisabilité)
- **Définition de la Cible** : Identifier précisément l'objectif métier et l'expérience utilisateur finale (Entrée vs Sortie).
- **Audit des Données** : Identifier les sources de données nécessaires (API, DB existante) et les manques potentiels.
- **Analyse d'Impact** : Anticiper comment la nouvelle fonction va modifier l'existant (Orchestrateur, DB, Frontend).
- **Modélisation du Flux** : Dessiner le trajet de la donnée avant d'écrire le code métier.

### 🏗️ Phase 2 : Assemblage (Socle Structurel)
- **Schéma de Données** : Créer ou modifier les tables, index et relations (Refactoring si nécessaire).
- **Modèles de Données** : Définir les types, classes et interfaces (Modèles Pydantic, SQLAlchemy, Typescript).
- **Squelette Infrastructure** : Préparer les fichiers, dossiers et stubs pour isoler la future fonctionnalité.
- **Vérification du Socle** : Valider que les fondations sont prêtes à accueillir la logique complexe.

### 🛠️ Phase 3 : Réalisation (Implémentation Stratifiée)
1. **Strate Ingestion** : Coder le cœur de l'échange de données (Fetchers, Scrapers, API Clients).
2. **Strate Métier** : Développer la logique de calcul (IA, Algorithmes, Audit, Filtres).
3. **Strate Intégration** : Connecter la fonction à l'orchestrateur ou aux triggers automatiques.

### ✅ Phase 4 : Recette & Maîtrise
- **Validation Unitaire** : Tester chaque strate indépendamment pour garantir la robustesse.
- **Audit de Données** : Valider la qualité et la pertinence des résultats produits.
- **Documentation & UI** : Mettre à jour l'interface utilisateur et la documentation technique (README, Schémas).
