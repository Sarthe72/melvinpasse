# Changelog

## 1.1.0 — Lecture des annonces en ligne
- Extraction automatique des offres publiques via une fonction sécurisée, avec prise en charge du lien LMM Habitat.
- Lecture des données structurées disponibles sur LinkedIn et Indeed, sans confondre une page anti-robot avec une annonce.
- Repli explicite pour les sources protégées comme Glassdoor : lien et titre conservés, texte à coller manuellement.
- Tests navigateur couvrant l'extraction réussie et le repli sur source protégée.

## 1.0.0 — MVP complet
- Application Flask locale, base SQLite et profil maître importé de façon idempotente.
- Parcours offre + logo, stockage sécurisé et pipeline historisé.
- Scoring expliqué et recommandations GO / À ÉTUDIER / NO GO.
- CV personnalisé, aperçu et export PDF A4 strictement limité à une page.
- Kit de candidature et entretien fondés sur les preuves du profil.
- Exports JSON, sauvegarde ZIP, interface responsive, tests, CI et Docker facultatif.

## 0.0.0 — Starter Codex
- Cahier des charges produit.
- Architecture cible.
- Spécification CV dynamique et scoring.
- Profil maître initial structuré.
- Trois PDF de référence inclus.
- Backlog autonome et instructions Codex.
