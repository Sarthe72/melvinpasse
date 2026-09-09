# Spécification produit — CV-Melvin V2

## Vision
CV-Melvin V2 n'est pas un éditeur de CV. C'est un cockpit personnel de recherche d'emploi qui transforme une offre en dossier de candidature cohérent et traçable.

## Parcours principal
1. Dashboard.
2. Nouvelle candidature.
3. Saisie : URL éventuelle, texte/PDF de l'offre, entreprise, intitulé si non détecté, logo fourni manuellement.
4. Extraction structurée de l'offre : missions, exigences, mots-clés, contraintes, localisation, rémunération si mentionnée.
5. Matching avec le profil maître.
6. Scoring : compatibilité profil, compatibilité critères personnels, attractivité/opportunité, confiance des données.
7. Recommandation : GO / À ÉTUDIER / NO GO, avec raisons.
8. Génération du CV personnalisé 1 page.
9. Génération du kit : lettre, message recruteur/LinkedIn, synthèse de candidature.
10. Préparation entretien : pitch, arguments, preuves STAR, questions probables, questions à poser, risques/points à clarifier.
11. Pipeline de suivi.

## Écrans MVP
- Dashboard : KPI simples + candidatures récentes + actions.
- Profil maître : consultation/édition des données structurées et preuves.
- Nouvelle candidature : offre + logo.
- Analyse candidature : scores, critères, correspondances, manques, recommandation.
- Éditeur/aperçu CV : blocs sélectionnés, justification de sélection, preview A4.
- Kit candidature.
- Préparation entretien.
- Pipeline/tableau candidatures.
- Fiche candidature avec historique.

## États candidature
A_ETUDIER, A_CANDIDATER, CANDIDATE, RELANCE, ENTRETIEN, OFFRE, ACCEPTE, REFUSE, ABANDONNE.

## IA
Prévoir une interface de provider abstraite. Le MVP doit fonctionner en mode déterministe/local sans clé API pour le scoring basique et le templating. Une intégration IA pourra être activée via variable d'environnement sans verrouiller le produit à un fournisseur.

## Règles de contenu
- Zéro invention.
- Chaque affirmation générée doit être rattachable à un élément du profil maître.
- L'IA peut sélectionner, condenser, reformuler et réordonner.
- Les réalisations chiffrées sont des « preuves » avec tags et provenance.
- Conserver un journal des éléments retenus/écartés et la raison.

## Critères utilisateur importants
Le scoring personnel doit pouvoir intégrer : autonomie, niveau de responsabilité, management, pilotage centre de profit/opérations, rémunération, rythme de travail et samedi, localisation/déplacements, intérêt du projet, latitude pour structurer/transformer.
