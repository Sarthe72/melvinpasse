# Changelog

## 1.3.6 — Ajout d’entretien rattaché au bon dossier
- Le bouton « Ajouter un entretien » reste immédiatement sous la candidature concernée, même lorsque CANDIDATURE FR est triée chronologiquement.
- Les entretiens datés continuent d’être classés selon leur propre date ; aucun bouton sans date n’est rejeté en bas du tableau.

## 1.3.5 — Tri chronologique de CANDIDATURE FR par défaut
- Le suivi s’ouvre sur le tri « CANDIDATURE FR » du plus récent au plus ancien.
- Les candidatures et leurs entretiens sont classés ensemble selon les dates affichées dans cette colonne ; chaque entretien conserve son entreprise identifiable.
- Les lignes sans date FR restent en fin de tableau. La date FR demeure saisie uniquement par l’utilisateur.

## 1.3.4 — Tri interactif des dates
- Les en-têtes « CANDIDATURE FR », « Date de candidature » et « Dernière mise à jour » trient le suivi d’un clic ; un second clic inverse l’ordre.
- Sur téléphone, ces trois tris sont également accessibles au-dessus des fiches, puisque les en-têtes du tableau sont masqués.
- Les dates inconnues restent en bas, les entretiens demeurent sous leur candidature et leurs dates suivent le sens du tri CANDIDATURE FR.
- À l’ajout d’une candidature, le tri par date d’ajout est rétabli pour afficher le nouveau dossier en tête.

## 1.3.3 — Dernier dossier ajouté en premier
- Le suivi affiche désormais les candidatures dans l’ordre d’ajout, de la plus récente à la plus ancienne. Une candidature nouvellement créée apparaît donc tout en haut, même si sa date d’envoi est inconnue.
- Les dates de candidature et d’entretien restent visibles dans leurs colonnes respectives et ne sont pas modifiées par ce tri.

## 1.3.2 — Une date visible par entretien
- Chaque entretien a désormais sa propre sous-ligne repliée avec sa date affichée dans la colonne « CANDIDATURE FR ».
- La date de candidature dans cette même colonne reste modifiable manuellement, sans modifier les entretiens.
- Les colonnes « Score » et « Analyse » sont retirées du tableau de suivi ; leurs informations restent dans la fiche du dossier.

## 1.3.1 — Entretiens repliés par défaut
- Les sous-lignes d’entretien montrent uniquement un résumé dans le tableau ; les formulaires s’ouvrent sur demande.
- Après le passage au statut « Entretien » ou la modification d’un rendez-vous, le panneau concerné reste ouvert pour poursuivre la saisie.

## 1.3.0 — Entretiens multiples et suivi plus compact
- Une sous-ligne d’entretiens apparaît sous une candidature au statut « Entretien » ou comportant déjà des rendez-vous. Plusieurs entretiens peuvent être ajoutés, modifiés et supprimés séparément.
- La colonne « Démarche » distingue la candidature de ses entretiens.
- Un bouton en haut du suivi ouvre directement l’ajout manuel d’une candidature ; le lien et la précision sont facultatifs.
- La colonne « Précision » reste repliée tant que l’utilisateur ne demande pas à la lire.

## 1.2.9 — Date « CANDIDATURE FR » saisie par l’utilisateur
- Nouvelle colonne immédiatement après « Entreprise », distincte de la date de candidature automatique.
- Le champ reste vide jusqu’à une saisie manuelle et peut être modifié ou effacé directement dans le suivi, sur ordinateur et téléphone.
- La saisie est conservée par la synchronisation ; le tri chronologique continue d’utiliser la date de candidature automatique.

## 1.2.8 — Dates automatiques et tri chronologique
- La date de candidature est désormais en lecture seule et la pipeline est triée du plus récent au plus ancien en fonction de cette date, indépendamment du statut.
- Les dates d'envoi explicites dans les notes des dossiers antérieurs sont affichées automatiquement ; une date inconnue reste indiquée comme telle et le dossier est placé en fin de liste.
- Aucun champ de saisie de date n'est proposé dans le tableau, la fiche ou le formulaire d'ajout.

## 1.2.7 — Date de candidature
- Date d'envoi distincte de la dernière mise à jour dans le tableau de suivi, modifiable directement sur ordinateur et téléphone.
- Les anciens dossiers gardent une date vide tant qu'elle n'est pas confirmée ; le passage au statut « Envoyée » initialise la date du jour pour les nouveaux envois.
- Le formulaire d'ajout d'un ancien dossier accepte sa date de candidature et la synchronisation conserve cette donnée.

## 1.2.6 — Logos dans le suivi
- Les dossiers ajoutés après candidature peuvent maintenant recevoir un logo d'entreprise fourni par l'utilisateur, à la création ou depuis leur fiche.
- Le logo choisi remplace les initiales dans le tableau et se synchronise entre appareils ; les fichiers sont limités aux formats PNG, JPG et WebP de 5 Mo maximum.
- Un logo déjà fourni pour une autre candidature de la même entreprise est réutilisé dans le suivi, notamment pour Partnaire.

## 1.2.5 — Suivi lisible sur toute la largeur
- Le poste ouvre directement le dossier : plus de lien d'action tronqué à droite.
- Les colonnes du tableau tiennent dans la fenêtre sur ordinateur ; sur écran étroit, chaque candidature devient une fiche avec ses libellés et son statut modifiable.
- Les annonces TalentUp importées affichent leurs accents normalement et distinguent le recruteur de l'employeur non divulgué.

## 1.2.4 — Candidatures plus humaines
- Lettres et messages plus courts, directs et moins scolaires, avec une seule réalisation pertinente au lieu d'un empilement de preuves.
- Angle adapté au secteur de l'annonce ; pour un secteur nouveau comme le social, la transition est formulée honnêtement sans expérience inventée.
- Intitulés de poste nettoyés pour éviter les mentions techniques « CDI », « H/F » et les répétitions du nom de l'employeur.
- Tests navigateur ajoutés pour les contextes social et logistique, le message court et le PDF A4.

## 1.2.3 — Lettres de motivation sans listes
- Les réalisations des lettres sont rédigées en paragraphes, sans tirets de liste ni tirets de ponctuation.
- La présentation utilise « dirigeant opérationnel » au lieu de répéter une durée d'expérience chiffrée.
- Le test navigateur vérifie le rendu de la lettre dans le kit de candidature.

## 1.2.2 — Lecture des annonces LinkedIn publiques
- Les liens LinkedIn de type `/jobs/view/<identifiant>` utilisent la fiche publique associée à l'identifiant, sans transmettre les paramètres de suivi personnels.
- Le titre, l'employeur, la localisation et le descriptif sont isolés et contrôlés avant analyse ; une fiche incomplète est refusée.
- Tests simulés et contrôle en direct sur l'annonce Carrefour/Allonnes ajoutés.
- Les annonces Indeed demandant une authentification restent protégées : aucun contenu ni score ne doit être inventé à partir du lien seul.
- L'interface explique explicitement le blocage Indeed et conserve la saisie de l'annonce comme solution de secours, avec un test navigateur.

## 1.2.1 — Import Apec fiabilisé
- L'offre Apec 179474342W est rapprochée de sa publication complète sur le site du recruteur Partnaire, avec vérification du titre, du recruteur et du début du descriptif.
- Si Apec ne livre qu'un extrait et qu'aucune publication complète vérifiée n'est accessible, l'interface le signale et maintient l'analyse au statut provisoire « À ÉTUDIER ».
- Tests de l'extraction, du rapprochement et du parcours dans le navigateur ajoutés.

## 1.2.0 — Modèle CV exécutif dynamique
- Le titre principal du CV reprend désormais exactement l'intitulé du poste analysé, au lieu d'afficher systématiquement « Directeur opérationnel ».
- Lecture dédiée des offres iCIMS intégrées, notamment Carrefour : ouverture automatique de la fiche embarquée et récupération du poste, de l'employeur et de l'annonce complète.
- Lettre de motivation entièrement réécrite comme un argumentaire de dirigeant : motivation liée à l'annonce, réalisations rédigées en prose, méthode de management et conclusion orientée enjeux.
- Message recruteur remplacé par une approche courte et directe avec un résultat fort, une demande d'échange claire et un objet réutilisable par e-mail.
- Extraction ARCHE/SNEXI nettoyée : suppression du bandeau cookies, des offres voisines et du pied de page ; conservation de la seule annonce sélectionnée et identification de l'employeur réel.
- Notes employeur Le Mans Métropole Habitat corrigées et séparées par source : Glassdoor 2,8/5 (3 avis) et Indeed 2,1/5 (9 avis), avec date de vérification et liens directs.
- Fiche recruteur ajoutée à chaque analyse : identité légale, ancienneté, taille, catégorie, siège, implantations, secteur, contexte et éventuelle note employeur sourcée.
- Les informations entreprise proviennent de sources publiques explicites et sont conservées 30 jours ; une donnée ou une note absente n'est jamais estimée.
- Nouvelle identité d'application mobile : favicon, icône iPhone, icônes PWA Android et variante adaptative « maskable ».
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
