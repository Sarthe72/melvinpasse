# Backlog autonome

## Lot 0 — Bootstrap [x]
- Initialiser Git, structure Flask, venv/requirements ou pyproject.
- Configuration, `.env.example`, `.gitignore`.
- Healthcheck, pytest, lint.
- Script Windows `run.bat` et script PowerShell `scripts/setup.ps1`.

## Lot 1 — Modèle métier [x]
- SQLAlchemy + SQLite.
- Modèles Company/Application/Offer/Evidence/GeneratedDocument/Event/Preference.
- Seed depuis `data/profile_master.json`.
- CRUD minimal + tests.

## Lot 2 — UI et pipeline [x]
- Dashboard.
- Nouvelle candidature.
- Upload logo sécurisé.
- Liste/fiche candidature + changement de statut.

## Lot 3 — Analyse & scoring [x]
- Parse texte offre.
- Extraction mots-clés/contraintes déterministe.
- Matching avec tags du profil.
- Scores et explications.
- GO/À ÉTUDIER/NO GO.

## Lot 4 — Moteur CV [x]
- Palette depuis logo.
- Sélection de preuves et bullets.
- Template HTML A4 fidèle à l'ADN des PDF.
- Preview.
- Export PDF une page + test de pagination.

## Lot 5 — Kit candidature [x]
- Lettre de motivation.
- Message recruteur/LinkedIn.
- Synthèse de candidature.
- Provider IA optionnel + fallback local.

## Lot 6 — Entretien [x]
- Pitch 60/120 secondes.
- Questions probables.
- Réponses basées sur preuves.
- Questions à poser.
- Points à clarifier.

## Lot 7 — Robustesse [x]
- Historique documents/événements.
- Exports et sauvegarde locale.
- Tests E2E parcours principal.
- Accessibilité et responsive raisonnable.

## Lot 8 — GitHub/CI [x]
- Workflow GitHub Actions tests/lint.
- README final avec lancement en une commande.
- Préparer conteneur Docker optionnel sans le rendre obligatoire.

## Maintenance — Offres Apec [x]
- Rapprocher la référence 179474342W d'une publication complète vérifiée chez Partnaire.
- Signaler explicitement les autres annonces Apec limitées à un extrait et rendre leur analyse provisoire.
- Couvrir les cas complet, partiel et source non concordante par des tests.
