# CV-Melvin V2 — Instructions Codex

Tu es l'agent principal de développement de CV-Melvin V2. Tu dois faire avancer le projet de manière autonome, sans demander à Melvin de coder, configurer ou arbitrer des détails techniques ordinaires.

## Mission
Construire une application personnelle de pilotage de candidatures : offre + logo entreprise -> analyse -> score GO/NO GO -> CV personnalisé 1 page -> kit candidature -> préparation entretien -> pipeline de suivi.

## Principes non négociables
1. Ne jamais inventer une compétence, un chiffre, une expérience, un diplôme ou une réalisation.
2. `data/profile_master.json` est la source de vérité structurée. Les PDF de `references/` sont les références visuelles et factuelles récentes.
3. En cas de contradiction, préférer les CV PDF récents au CV digital public.
4. Le logo de l'entreprise est fourni manuellement par l'utilisateur. Ne jamais implémenter de récupération automatique de logo.
5. Le CV final doit tenir sur UNE page A4.
6. L'identité Melvin reste reconnaissable, mais le titre, l'accroche, la hiérarchie, les preuves et la palette s'adaptent à l'offre.
7. Les données personnelles et candidatures restent locales par défaut.
8. Prioriser un MVP robuste et simple. Éviter les dépendances SaaS payantes inutiles.
9. Chaque fonctionnalité doit avoir des tests pertinents.
10. Avant une modification importante : lire `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/CV_TEMPLATE_SPEC.md` et `docs/AUTONOMOUS_BACKLOG.md`.

## Mode autonome
- Inspecter l'état du dépôt avant d'agir.
- Implémenter le prochain lot non terminé dans `docs/AUTONOMOUS_BACKLOG.md`.
- Exécuter tests/lint après chaque lot.
- Corriger les erreurs avant de poursuivre.
- Mettre à jour le backlog et `CHANGELOG.md`.
- Faire des commits Git atomiques si Git est disponible.
- Ne demander une validation humaine que pour une décision métier réellement ambiguë ou une action externe irréversible.

## Définition de terminé
Le MVP est terminé quand un utilisateur peut : créer une candidature, saisir/coller une offre, importer un logo, obtenir l'analyse et le scoring, générer/prévisualiser/télécharger un CV personnalisé 1 page, générer lettre/message/préparation entretien, puis suivre le statut de la candidature.
