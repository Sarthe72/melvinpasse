# Architecture cible

## Choix
Application monolithique modulaire Flask, locale-first. C'est volontaire : le produit est mono-utilisateur au départ, doit rester simple à lancer et pourra être conteneurisé plus tard.

## Modules
- `app/` factory Flask, config, extensions.
- `domain/` modèles métier et services purs.
- `repositories/` accès SQLAlchemy.
- `services/offers.py` parsing/analyse d'offre.
- `services/scoring.py` matching et recommandation.
- `services/palette.py` palette depuis logo fourni.
- `services/cv_builder.py` sélection des blocs.
- `services/pdf.py` rendu HTML -> PDF.
- `services/content.py` kit candidature/entretien.
- `templates/` UI + template CV A4.
- `static/` CSS/JS/assets.
- `instance/` SQLite et uploads locaux, ignorés par Git.

## Données principales
Company, Application, Offer, ProfileItem, Evidence, GeneratedDocument, ApplicationEvent, UserPreference.

## Stockage
SQLite par défaut. Uploads sous `instance/uploads/<application_uuid>/`. Ne jamais stocker de chemin arbitraire fourni par l'utilisateur. Noms générés côté serveur.

## PDF
Le CV est une page HTML/CSS A4 rendue par Chromium/Playwright. Ajouter un test automatique de nombre de pages. Si le contenu déborde, appliquer une stratégie de compression contrôlée : réduire contenu avant de réduire fortement la typographie.

## Sécurité
Local par défaut. Valider MIME/extensions logo et offre. Limite de taille. Pas de secrets dans Git. `.env.example` uniquement.
