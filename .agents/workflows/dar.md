---
description: Méthode DAR (Diagnostic - Ablation - Reconstruction) pour la résolution de problèmes majeurs.
---

Cette méthode structurée est conçue pour résoudre les problèmes techniques complexes, les instabilités d'environnement ou les saturations de ressources.

### 🩺 Phase 1 : Diagnostic Clinique (L'Audit Factuel)
- **Stop-and-Watch** : Interdiction formelle de modifier le code pendant cette phase.
- **Métriques Vitales** : Relever l'usage RAM, CPU et les temps de compilation/réponse.
- **Isolation de la Racine** : Identifier l'erreur "vraie" (le blocage structurel) au milieu des erreurs en cascade.
- **Rapport Clinique** : Présenter une analyse purement factuelle sans action corrective immédiate.

### 🗑️ Phase 2 : Ablation & Sanification (Le Hard Reset)
- **Nettoyage des Caches** : Supprimer les dossiers de build (`.next/`, `build/`, `dist/`).
- **Nettoyage des Dépendances** : Supprimer le dossier `node_modules`.
- **Alignement Structurel** : Éliminer les fichiers de verrouillage (`package-lock.json`, `yarn.lock`) en conflit ou dupliqués dans les dossiers parents.

### 🏗️ Phase 3 : Reconstruction Stratifiée (Séquentielle)
1. **Strate 1 (Dépendances)** : Réinstaller proprement les packages et vérifier le succès de l'installation.
2. **Strate 2 (Infrastructure)** : Auditer les fichiers de configuration (`package.json`, `postcss`, `tailwind`, etc.) pour garantir leur cohérence.
3. **Strate 3 (Code Source)** : Ajuster les sources pour s'aligner sur l'infrastructure stabilisée.

### 📈 Phase 4 : Vérification des Constantes
- Redémarrer le système (`npm run dev`).
- Valider que les performances système et les temps de réponse sont redevenus nominaux.
