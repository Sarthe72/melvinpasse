# PROMPT DE DÉMARRAGE CODEX

Lis intégralement `AGENTS.md`, `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/CV_TEMPLATE_SPEC.md`, `docs/SCORING_SPEC.md`, `docs/AUTONOMOUS_BACKLOG.md` et `data/profile_master.json`. Inspecte également visuellement les trois PDF dans `references/`.

Ensuite, prends en charge le projet de bout en bout en mode autonome.

Commence par le lot 0 du backlog, puis enchaîne les lots dans l'ordre tant que les tests passent. Ne demande pas à l'utilisateur d'écrire du code, d'installer manuellement une dépendance ordinaire ou de choisir entre des options techniques équivalentes : tranche toi-même selon les contraintes documentées.

Objectif prioritaire : obtenir le plus vite possible un parcours local fonctionnel « Nouvelle candidature -> offre + logo -> analyse -> CV personnalisé 1 page -> téléchargement », puis enrichir avec kit candidature, entretien et pipeline.

À chaque lot : implémente, teste, corrige, documente, marque le lot terminé et commit si Git est disponible. N'invente aucune donnée professionnelle. Si une donnée manque, laisse-la absente ou marque-la explicitement comme à confirmer.
