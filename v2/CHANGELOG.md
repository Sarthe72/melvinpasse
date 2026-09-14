# Changelog

## 1.2.0 — Modèle CV exécutif dynamique
- Nouveau gabarit A4 pleine largeur issu de la maquette éditoriale validée, avec davantage d'espace blanc et sans barre latérale massive.
- Palette harmonieuse calculée automatiquement depuis le logo fourni, avec teintes d'accent, sombres, neutres et claires contrôlées.
- Logo du recruteur toujours conservé dans sa forme originale : aucun filtre, recadrage ou recoloriage.
- Photo professionnelle et QR code du CV digital intégrés à tous les CV.
- Poste cible, positionnement, compétences et ordre des réalisations adaptés à l'annonce sans invention.
- Engagements précisés : Initiative Sarthe et 13 ans comme secrétaire d'un club de football amateur.
- Tests navigateur mis à jour pour contrôler la page A4, la palette dynamique, l'intégrité du logo, le QR code et l'absence de débordement.
- Extraction de localisation sécurisée : seuls les libellés géographiques explicites sont retenus ; les fragments de mission comme « sécurité du patrimoine » sont rejetés.
- Bloc « Informations détectées » clarifié avec un état visible « Détecté » ou « À confirmer » pour chaque donnée.

## 1.1.0 — Lecture des annonces en ligne
- Lecture dédiée des offres APEC via leur référence publique, avec repli sur la recherche APEC lorsque le détail est protégé.
- Les pages regroupant plusieurs offres, notamment LMM Habitat, sont maintenant limitées à l’annonce sélectionnée dans le lien.
- Extraction automatique des offres publiques via une fonction sécurisée, avec prise en charge du lien LMM Habitat.
- Lecture des données structurées disponibles sur LinkedIn et Indeed, sans confondre une page anti-robot avec une annonce.
- Repli explicite pour les sources protégées comme Glassdoor : lien et titre conservés, texte à coller manuellement.
- Tests navigateur couvrant l'extraction réussie et le repli sur source protégée.
- Analyse détaillée : justification du verdict, attentes de l'employeur, correspondances sourcées dans le profil et informations à clarifier.
- Correction de la rémunération : un volume comme « 14 000 logements » ne peut plus être interprété comme un salaire.
- Repères de rémunération validés : package cible de 85 k€ primes incluses, fixe visé de 65 k€ et intérêt possible au-delà de 55 k€.
- Téléchargement A4 du CV et de la lettre de motivation directement depuis le kit de candidature.
- Suivi remplacé par un tableau avec verdict, score, date et statut modifiable sur chaque ligne.
- Suppression du bouton d'export technique de la fiche candidature.
- Compteurs du tableau de bord cliquables, avec ouverture directe de la liste filtrée correspondante.
- CV dynamique reconstruit sur la structure visuelle de la référence SPIE, toujours en une page A4.
- En-tête du CV corrigé sans chevauchement et palette harmonisée automatiquement à partir du logo de l'entreprise.
- Colonne colorée sécurisée dans le PDF, y compris lorsque le navigateur désactive l'impression des arrière-plans.
- Nouvelle photo professionnelle `1K0A5053.jpg` utilisée pour tous les CV générés.

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
