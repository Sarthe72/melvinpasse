# CV-Melvin V2

Cockpit local de candidature : une offre et un logo entrent, un dossier factuel et ciblé en sort.

## Démarrage Windows

Double-cliquer sur **`run.bat`**. Au premier lancement, le script crée l'environnement Python, installe les dépendances et Chromium, initialise la base locale puis lance le serveur sur `http://127.0.0.1:5000`.

Prérequis : Windows et Python 3.12. Aucun compte en ligne, abonnement ou clé API n'est nécessaire.

## Parcours utilisateur

1. Cliquer sur **Nouvelle candidature**.
2. Renseigner l'entreprise et le poste, coller l'offre complète et sélectionner le logo fourni.
3. Consulter le scoring expliqué : profil, critères personnels, opportunité, confiance et recommandation.
4. Prévisualiser puis télécharger le CV personnalisé A4 d'une page.
5. Ouvrir le kit de candidature et la préparation d'entretien.
6. Mettre à jour le statut dans le pipeline.
7. Exporter un dossier JSON ou télécharger la sauvegarde locale.

## Garanties

- `data/profile_master.json` est la source de vérité.
- Les contenus sélectionnent ou réordonnent uniquement des faits existants.
- Les exigences absentes du profil sont signalées comme non confirmées.
- Le logo n'est jamais recherché automatiquement.
- SQLite, logos et historique restent dans `instance/`, ignoré par Git.
- Aucun fournisseur IA n'est requis.
- L'export PDF est refusé s'il n'occupe pas exactement une page.

## Contrôles techniques

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
.venv\Scripts\python.exe -m ruff check .
.venv\Scripts\python.exe -m pytest
```

## Docker facultatif

```powershell
docker build -t cv-melvin-v2 .
docker run --rm -p 5000:5000 -v ${PWD}/instance:/app/instance cv-melvin-v2
```
