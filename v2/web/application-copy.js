function copyOfferAngle(item) {
  const text = norm(`${item.title} ${item.offer}`);
  if (has(text,["expertise immobiliere","diagnostic immobilier","etat des lieux","multiservices","snexi"])) return "développer une offre de services immobiliers tout en transformant les projets en résultats opérationnels concrets";
  if (has(text,["habitant","logement","bailleur","proximite","patrimoine immobilier"])) return "faire progresser la qualité de service aux habitants et piloter des équipes de proximité dans un environnement exigeant";
  if (has(text,["logistique","supply chain","transport","plateforme","flux"])) return "conjuguer performance des opérations, maîtrise des flux et engagement des équipes";
  if (has(text,["industrie","production","usine","maintenance"])) return "piloter la performance d’un site en associant exigence industrielle, sécurité et management de terrain";
  if (has(text,["croissance","developpement","transformation","projet transverse"])) return "structurer le développement, conduire des projets transverses et installer une performance durable";
  if (has(text,["management","equipe","collaborateur"])) return "donner un cap clair aux équipes et traduire les objectifs de l’entreprise en résultats mesurables";
  return "prendre en charge un périmètre opérationnel avec autonomie, méthode et exigence de résultat";
}

function copyEvidenceScore(proof, offer) {
  const text = norm(offer);
  return proof.tags.filter(tag => text.includes(norm(tag))).length;
}

function selectCopyEvidence(item) {
  const selected = [...(item.analysis?.evidence || [])];
  const fallback = [...profile.evidence].sort((left,right) => copyEvidenceScore(right,item.offer) - copyEvidenceScore(left,item.offer));
  fallback.forEach(proof => {
    if (!selected.some(value => value.id === proof.id)) selected.push(proof);
  });
  return selected.slice(0,2);
}

function longProofSentence(proof) {
  const verified = {
    "move-2024":"En 2024, j’ai piloté de bout en bout le déménagement d’un site de 1 200 m², depuis la négociation du bail jusqu’à la coordination des travaux, des prestataires et des équipes. Le nouveau site est devenu opérationnel en huit mois, avec un budget inférieur de 47 % à la prévision initiale et sans interruption d’activité.",
    "peak-2x8":"Face à un pic d’activité majeur, j’ai conçu et animé une organisation en 2x8 mobilisant jusqu’à 40 collaborateurs pendant trois semaines. Cette organisation a permis d’établir un record depuis la création de l’entreprise en 2005, puis d’être reconduite en 2024 et 2025.",
    "supplier-savings":"La remise à plat des contrats fournisseurs que j’ai conduite a généré environ 270 k€ d’économies annuelles, soit une réduction proche de 40 %, tout en maintenant les exigences opérationnelles.",
    growth:"J’ai également accompagné la structuration d’une activité passée de 250 k€ à 36 M€ de chiffre d’affaires et la croissance d’un service de 3 à 23 collaborateurs en dix ans.",
  };
  return verified[proof.id] || `${proof.title} : ${proof.facts.slice(0,2).join(" ; ")}.`;
}

function shortProofSentence(proof) {
  const verified = {
    "move-2024":"un déménagement de site de 1 200 m² livré en huit mois, à 47 % sous le budget prévisionnel et sans interruption d’activité",
    "peak-2x8":"une organisation en 2x8 mobilisant jusqu’à 40 collaborateurs et reconduite trois années de suite",
    "supplier-savings":"une renégociation fournisseurs générant environ 270 k€ d’économies annuelles, soit près de 40 %",
    growth:"la structuration d’une activité passée de 250 k€ à 36 M€ de chiffre d’affaires et d’un service passé de 3 à 23 collaborateurs",
  };
  return verified[proof.id] || `${proof.title.toLowerCase()} (${proof.facts[0]})`;
}

function applicationCopy(item) {
  const company = item.company || "votre organisation";
  const angle = copyOfferAngle(item);
  const proofs = selectCopyEvidence(item);
  const requirements = (item.analysis?.requirements || []).slice(0,3).map(value => value.label.toLowerCase());
  const priorities = requirements.length ? requirements.join(", ") : (item.analysis?.matches || []).slice(0,3).map(value => value.toLowerCase()).join(", ");
  const letterBody = `Madame, Monsieur,

La perspective de rejoindre ${company} au poste de ${item.title} m’intéresse pour une raison précise : ${angle}.

Mon parcours s’est construit pendant 16 ans au sein de la même structure, depuis le terrain jusqu’à la direction d’un site et d’un centre de profit. Cette progression m’a appris à relier vision, exigence de résultat et réalité opérationnelle : fixer un cap, structurer les méthodes, donner aux équipes les moyens de l’atteindre et mesurer les résultats.

${longProofSentence(proofs[0])}

${longProofSentence(proofs[1])}

${priorities ? `Les priorités décrites dans votre annonce — ${priorities} — font ainsi directement écho à mon expérience. ` : ""}Ma manière de diriger repose sur une présence réelle auprès des équipes, des objectifs lisibles et une prise de décision fondée sur les faits. Je souhaite mettre cette approche au service de ${company}, avec la même attention portée à la qualité d’exécution, à la dynamique collective et aux résultats.

Je serais heureux d’échanger avec vous sur les objectifs confiés au futur titulaire du poste, le niveau d’autonomie attendu et les résultats prioritaires des premiers mois.

Bien cordialement,`;
  const letter = `${letterBody}\n${profile.identity.name}`;
  const message = `Bonjour,

Je me permets de vous contacter directement au sujet du poste de ${item.title} chez ${company}, afin que mon parcours puisse être étudié avec le contexte nécessaire.

Après 16 années au sein de la même structure, j’ai construit une expérience complète du terrain à la direction d’un site : pilotage d’un centre de profit, management d’équipes jusqu’à 40 collaborateurs, structuration des process et conduite de projets de transformation.

Parmi les réalisations les plus directement transposables au poste : ${shortProofSentence(proofs[0])}. Le périmètre présenté dans votre annonce fait ainsi écho à une expérience concrète, construite dans la durée et orientée résultats.

Je vous joins mon CV et vous invite également à consulter sa version digitale :\nhttps://${profile.identity.cv_url}

Seriez-vous disponible pour un échange de 15 minutes afin de vérifier ensemble l’adéquation entre vos enjeux et mon expérience ?

Bien cordialement,
${profile.identity.name}\n${profile.identity.linkedin}`;
  return {letterBody,letter,message,subject:`Candidature – ${item.title} – ${profile.identity.name}`,angle,proofs,priorities};
}

kit = function premiumApplicationKit(id) {
  const item = getItem(id);
  if (!item) return dashboard();
  const copy = applicationCopy(item);
  layout(item.title,"Kit candidature",`<section class="panel pdf-downloads"><div><p class="eyebrow">Documents prêts</p><h2>Télécharger en PDF</h2><p>CV et lettre personnalisés au format A4.</p></div><div class="pdf-actions"><button class="button" id="pdf-cv">CV personnalisé</button><button class="button secondary" id="pdf-letter">Lettre de motivation</button></div></section><section class="content-grid application-copy-grid"><article class="panel wide copy-document"><div class="copy-heading"><div><p class="eyebrow">Version personnalisée</p><h2>Lettre de motivation</h2></div><button class="button small copy" data-copy="letter">Copier la lettre</button></div><pre class="generated" data-content="letter">${esc(copy.letter)}</pre></article><article class="panel copy-document"><div class="copy-heading"><div><p class="eyebrow">Approche directe</p><h2>Message au recruteur</h2></div><button class="button small copy" data-copy="message">Copier</button></div><p class="message-subject"><b>Objet :</b> ${esc(copy.subject)}</p><pre class="generated" data-content="message">${esc(copy.message)}</pre></article><article class="panel copy-rationale"><p class="eyebrow">Pourquoi ce texte</p><h2>Angle retenu</h2><p>${esc(copy.angle)}.</p><ul>${copy.proofs.map(proof => `<li>${esc(proof.title)}</li>`).join("")}</ul><small>Uniquement des éléments vérifiés dans le profil maître et l’annonce.</small></article></section>`,`<a class="button secondary" href="#application/${id}">Retour à l’analyse</a>`);
  document.querySelector("#pdf-cv").onclick = () => {sessionStorage.setItem("cv-melvin-auto-pdf",`cv/${id}`);location.hash=`cv/${id}`};
  document.querySelector("#pdf-letter").onclick = () => {sessionStorage.setItem("cv-melvin-auto-pdf",`letter/${id}`);location.hash=`letter/${id}`};
  document.querySelectorAll(".copy").forEach(button => button.onclick = () => {
    const content = document.querySelector(`[data-content="${button.dataset.copy}"]`).textContent;
    navigator.clipboard.writeText(content).then(() => toast("Texte copié"));
  });
};
