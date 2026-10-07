function copyOfferAngle(item) {
  const text = norm(`${item.title} ${item.offer} ${item.company}`);
  if (has(text,["protection de l'enfance","protection de l’enfance","accueil familial","serafm","aide sociale a l'enfance","medico-social","handicap","accompagnement social"])) return "mettre mon expérience de direction au service d’un projet humain";
  if (has(text,["expertise immobiliere","diagnostic immobilier","etat des lieux","multiservices","snexi"])) return "structurer une activité de services immobiliers et accompagner ses équipes";
  if (has(text,["habitant","logement","bailleur","habitat","patrimoine immobilier"])) return "améliorer concrètement le service rendu aux habitants";
  if (has(text,["logistique","supply chain","transport","plateforme","flux"])) return "tenir les engagements opérationnels sans perdre de vue les équipes";
  if (has(text,["industrie","production","usine","maintenance"])) return "faire avancer un site avec ses équipes, au plus près du terrain";
  if (has(text,["croissance","developpement","transformation","projet transverse"])) return "structurer une activité qui évolue et aider les équipes à franchir une étape";
  return "prendre la responsabilité d’une activité et faire avancer les équipes avec des objectifs clairs";
}

function copySector(item) {
  const text = norm(`${item.title} ${item.offer} ${item.company}`);
  if (has(text,["protection de l'enfance","protection de l’enfance","accueil familial","serafm","aide sociale a l'enfance","medico-social","handicap","accompagnement social"])) return "social";
  if (has(text,["habitant","logement","bailleur","habitat","patrimoine immobilier","expertise immobiliere"])) return "housing";
  if (has(text,["logistique","supply chain","transport","plateforme","flux"])) return "logistics";
  return "general";
}

function copyRole(item) {
  if (copySector(item)==="social" && has(norm(item.title),["serafm"])) return "directeur du SERAFM";
  const company=String(item.company||"").trim();
  let title=String(item.title||"poste proposé").replace(/^\s*(?:CDI|CDD)\s+/i,"").replace(/\s*\(?H\s*\/\s*F\)?\s*/gi," ").replace(/\bTP\b/gi,"").trim();
  if(company && title.toLowerCase().endsWith(` - ${company.toLowerCase()}`)) title=title.slice(0,-company.length-3).trim();
  title=title.replace(/\s+/g," ");
  return title===title.toLocaleUpperCase("fr")?title.toLocaleLowerCase("fr"):title[0].toLocaleLowerCase("fr")+title.slice(1);
}

function copyEvidenceScore(proof, offer) {
  const text = norm(offer);
  return proof.tags.filter(tag => text.includes(norm(tag))).length;
}

function selectCopyEvidence(item) {
  const sector=copySector(item);
  const preferred=sector==="social"?["peak-2x8","move-2024"]:sector==="housing"?["move-2024","peak-2x8"]:sector==="logistics"?["peak-2x8","move-2024"]:[];
  const selected=[...(item.analysis?.evidence||[]),...profile.evidence];
  const unique=[...new Map(selected.map(proof=>[proof.id,proof])).values()];
  return unique.sort((left,right) => {
    const leftPreference=preferred.indexOf(left.id),rightPreference=preferred.indexOf(right.id);
    if(leftPreference!==rightPreference)return (leftPreference<0?99:leftPreference)-(rightPreference<0?99:rightPreference);
    return copyEvidenceScore(right,item.offer)-copyEvidenceScore(left,item.offer);
  }).slice(0,1);
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

function shortProofAction(proof) {
  const verified = {
    "move-2024":"piloté un déménagement de site de 1 200 m², réalisé en huit mois sans interruption d’activité",
    "peak-2x8":"organisé un fonctionnement en 2x8 mobilisant jusqu’à 40 collaborateurs",
    "supplier-savings":"renégocié des contrats fournisseurs, avec environ 270 k€ d’économies annuelles",
    growth:"accompagné la croissance d’une activité passée de 250 k€ à 36 M€ de chiffre d’affaires",
  };
  return verified[proof.id] || `mené ce projet : ${proof.facts[0].toLowerCase()}`;
}

function applicationCopy(item) {
  const company = item.company || "votre organisation";
  const role = copyRole(item);
  const sector = copySector(item);
  const angle = copyOfferAngle(item);
  const proofs = selectCopyEvidence(item);
  const opening = sector==="social"
    ? `Je souhaite aujourd’hui donner du sens à ce que je sais faire. C’est dans cet esprit que je vous propose ma candidature au poste de ${role} chez ${company}.`
    : `Votre poste de ${role} chez ${company} m’intéresse pour une raison simple : ${angle}.`;
  const transition = sector==="social"
    ? `Je n’ai pas exercé dans le secteur social et je ne prétends pas en connaître d’emblée toutes les exigences. J’apporterais mon expérience du pilotage et du management en m’appuyant sur les professionnels qui connaissent le métier et les personnes accompagnées.`
    : `Je ne connais pas encore vos équipes ni les contraintes propres à votre organisation. J’aimerais comprendre ce qui fonctionne déjà, ce qui doit changer et la place que vous souhaitez donner à la personne qui prendra ce poste.`;
  const messageReason = sector==="social"
    ? `Je souhaite donner un sens nouveau à ce que je sais faire, sans prétendre avoir déjà exercé dans votre secteur.`
    : `Ce qui m’intéresse dans votre offre, c’est de ${angle}.`;
  const letterBody = `Madame, Monsieur,

${opening}

Je suis dirigeant opérationnel. J’ai commencé sur le terrain avant de prendre la direction d’un site et d’un centre de profit. Cette progression m’a appris à écouter les équipes, à fixer des priorités compréhensibles et à faire tenir l’activité, y compris dans les périodes tendues.

${longProofSentence(proofs[0])}

${transition}

Je serais heureux d’échanger avec vous sur les besoins réels du poste et sur ce que mon parcours pourrait apporter à ${company}.

Bien cordialement,`;
  const letter = `${letterBody}\n${profile.identity.name}`;
  const message = `Bonjour,

Je vous écris au sujet du poste de ${role} chez ${company}.

Je suis dirigeant opérationnel. J’ai progressé du terrain à la direction d’un site, avec le pilotage d’un centre de profit et d’équipes allant jusqu’à 40 collaborateurs. J’ai notamment ${shortProofAction(proofs[0])}.

${messageReason}

Je vous joins mon CV. Sa version digitale est également disponible ici :\nhttps://${profile.identity.cv_url}

Si mon parcours vous semble pouvoir répondre à vos besoins, je serais heureux d’en discuter avec vous.

Bien cordialement,
${profile.identity.name}`;
  return {letterBody,letter,message,subject:`Candidature au poste de ${role} | ${profile.identity.name}`,angle,proofs};
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
