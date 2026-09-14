const COMPANY_INSIGHT_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const COMPANY_INSIGHT_VERSION = 2;
const VERIFIED_EMPLOYER_RATINGS = {
  "le mans metropole habitat": [
    {source:"Glassdoor",value:2.8,best:5,count:3,checkedAt:"2026-09-14",sourceUrl:"https://www.glassdoor.fr/Avis/Le-Mans-M%C3%A9tropole-Habitat-Avis-E3095217.htm"},
    {source:"Indeed",value:2.1,best:5,count:9,checkedAt:"2026-09-14",sourceUrl:"https://fr.indeed.com/cmp/Le-Mans-M%C3%A9tropole-Habitat-1/reviews"},
  ],
};

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function companyFact(label, value, detail = "") {
  if (!value) return "";
  return `<article class="company-fact"><small>${esc(label)}</small><strong>${esc(value)}</strong>${detail ? `<span>${esc(detail)}</span>` : ""}</article>`;
}

const COMPANY_EMPLOYEE_RANGES = {"00":"0 salarié","01":"1 à 2 salariés","02":"3 à 5 salariés","03":"6 à 9 salariés","11":"10 à 19 salariés","12":"20 à 49 salariés","21":"50 à 99 salariés","22":"100 à 199 salariés","31":"200 à 249 salariés","32":"250 à 499 salariés","41":"500 à 999 salariés","42":"1 000 à 1 999 salariés","51":"2 000 à 4 999 salariés","52":"5 000 à 9 999 salariés","53":"10 000 salariés ou plus"};
const COMPANY_CATEGORIES = {GE:"Grande entreprise",ETI:"Entreprise de taille intermédiaire",PME:"PME",TPE:"Très petite entreprise"};
const COMPANY_SECTORS = {A:"Agriculture, sylviculture et pêche",B:"Industries extractives",C:"Industrie manufacturière",D:"Énergie",E:"Eau, assainissement et déchets",F:"Construction",G:"Commerce et réparation",H:"Transport et entreposage",I:"Hébergement et restauration",J:"Information et communication",K:"Finance et assurance",L:"Activités immobilières",M:"Activités spécialisées, scientifiques et techniques",N:"Services administratifs et de soutien",O:"Administration publique",P:"Enseignement",Q:"Santé et action sociale",R:"Arts, spectacles et loisirs",S:"Autres activités de services"};
const COMPANY_IGNORED_WORDS = new Set(["de","des","du","la","le","les","et","en","sa","sas","sasu","groupe","group","societe","société","france","holding","compagnie","company","entreprise"]);

function normalizedCompany(value = "") {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function companyTokens(value = "") {
  return normalizedCompany(value).split(/\s+/).filter(word => word.length > 1 && !COMPANY_IGNORED_WORDS.has(word));
}

function companyMatchScore(query, candidate) {
  const left = normalizedCompany(query), right = normalizedCompany(candidate);
  if (!left || !right) return 0;
  if (left === right) return 2;
  if (right.includes(left) || left.includes(right)) return 1.4;
  const queryTokens = companyTokens(query), candidateTokens = new Set(companyTokens(candidate));
  return queryTokens.length ? queryTokens.filter(word => candidateTokens.has(word)).length / queryTokens.length : 0;
}

function verifiedEmployerRatings(company) {
  return VERIFIED_EMPLOYER_RATINGS[normalizedCompany(company)] || [];
}

async function fetchPublicJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {signal: controller.signal, headers:{Accept:"application/json"}});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOfficialCompany(company) {
  const apiUrl = new URL("https://recherche-entreprises.api.gouv.fr/search");
  apiUrl.searchParams.set("q", company);
  apiUrl.searchParams.set("page", "1");
  apiUrl.searchParams.set("per_page", "5");
  const payload = await fetchPublicJson(apiUrl);
  const selected = (payload.results || []).map(entry => ({entry,score:companyMatchScore(company, entry.nom_complet || entry.nom_raison_sociale || "")})).sort((a,b) => b.score - a.score)[0];
  if (!selected || selected.score < 0.6) return null;
  const entry = selected.entry, headOffice = entry.siege || {};
  return {
    legalName: entry.nom_raison_sociale || entry.nom_complet || company,
    siren: String(entry.siren || ""),
    status: entry.etat_administratif === "A" ? "Structure active" : "Situation à vérifier",
    foundedYear: String(entry.date_creation || "").slice(0, 4) || null,
    employeeRange: COMPANY_EMPLOYEE_RANGES[String(entry.tranche_effectif_salarie || headOffice.tranche_effectif_salarie || "")] || null,
    employeeYear: entry.annee_tranche_effectif_salarie || headOffice.annee_tranche_effectif_salarie || null,
    category: COMPANY_CATEGORIES[entry.categorie_entreprise] || entry.categorie_entreprise || null,
    headquarters: headOffice.libelle_commune || headOffice.adresse || null,
    openSites: Number(entry.nombre_etablissements_ouverts || 0) || null,
    sector: COMPANY_SECTORS[entry.section_activite_principale] || null,
    naf: entry.activite_principale || null,
    updatedAt: String(entry.date_mise_a_jour_insee || entry.date_mise_a_jour || "").slice(0, 10) || null,
    sourceUrl: `https://annuaire-entreprises.data.gouv.fr/rechercher?terme=${encodeURIComponent(company)}`,
  };
}

async function fetchWikipediaCompany(company) {
  const apiUrl = new URL("https://fr.wikipedia.org/w/api.php");
  Object.entries({action:"query",format:"json",origin:"*",generator:"search",gsrsearch:company,gsrlimit:"4",prop:"extracts|info",exintro:"1",explaintext:"1",exsentences:"3",inprop:"url"}).forEach(([key,value]) => apiUrl.searchParams.set(key,value));
  const payload = await fetchPublicJson(apiUrl);
  const selected = Object.values(payload.query?.pages || {}).map(entry => ({entry,score:companyMatchScore(company, entry.title || "")})).sort((a,b) => b.score - a.score)[0];
  if (!selected || selected.score < 0.75 || !String(selected.entry.extract || "").trim()) return null;
  return {title:selected.entry.title || company,text:String(selected.entry.extract).trim().slice(0,850),sourceUrl:selected.entry.fullurl || ""};
}

function findStructuredJob(value) {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findStructuredJob(child);
      if (found) return found;
    }
    return null;
  }
  const type = value["@type"];
  if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) return value;
  for (const child of Object.values(value)) {
    const found = findStructuredJob(child);
    if (found) return found;
  }
  return null;
}

async function fetchEmployerRating(rawUrl) {
  const url = new URL(rawUrl);
  if (!/^https?:$/.test(url.protocol)) return null;
  const response = await fetch(url, {mode:"cors"});
  if (!response.ok) return null;
  const html = await response.text();
  const documentCopy = new DOMParser().parseFromString(html, "text/html");
  for (const script of documentCopy.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const job = findStructuredJob(JSON.parse(script.textContent || ""));
      const aggregate = job?.hiringOrganization?.aggregateRating;
      const value = Number(aggregate?.ratingValue), best = Number(aggregate?.bestRating || 5);
      const count = Number(aggregate?.ratingCount || aggregate?.reviewCount || 0);
      if (value > 0 && best > 0 && value <= best && count > 0) {
        return {value,best,count,source:url.hostname.replace(/^www\./,""),sourceUrl:url.href};
      }
    } catch {
      // Continue: job pages often contain unrelated structured-data blocks.
    }
  }
  return null;
}

function companyPanelHtml(insight, loading = false) {
  if (loading) return `<section class="panel company-insights loading" aria-live="polite"><p class="eyebrow">Aide à la décision</p><h2>L’entreprise en bref</h2><p class="muted">Recherche des informations publiques vérifiables…</p></section>`;
  const official = insight?.official;
  const summary = insight?.summary;
  const ratings = insight?.ratings || (insight?.rating ? [insight.rating] : []);
  if (!official && !summary && !ratings.length) {
    return `<section class="panel company-insights ready"><p class="eyebrow">Aide à la décision</p><h2>L’entreprise en bref</h2><p>Pas assez d’informations publiques fiables pour établir une fiche. Cela ne constitue ni un signal positif ni un signal négatif.</p><p class="company-note">Aucune note employeur publique et correctement sourcée n’a été trouvée.</p></section>`;
  }
  const facts = official ? [
    companyFact("Statut", official.status),
    companyFact("Taille", official.employeeRange, official.employeeYear ? `donnée ${official.employeeYear}` : ""),
    companyFact("Catégorie", official.category),
    companyFact("Création", official.foundedYear),
    companyFact("Siège", official.headquarters),
    companyFact("Implantations", official.openSites ? `${official.openSites} établissements ouverts` : ""),
    companyFact("Secteur", official.sector, official.naf ? `NAF ${official.naf}` : ""),
  ].filter(Boolean).join("") : "";
  const sourceLinks = [
    official?.sourceUrl ? `<a href="${esc(safeExternalUrl(official.sourceUrl))}" target="_blank" rel="noopener">Données publiques françaises</a>` : "",
    summary?.sourceUrl ? `<a href="${esc(safeExternalUrl(summary.sourceUrl))}" target="_blank" rel="noopener">Contexte Wikipédia</a>` : "",
    ...ratings.map(rating => rating.sourceUrl ? `<a href="${esc(safeExternalUrl(rating.sourceUrl))}" target="_blank" rel="noopener">Avis ${esc(rating.source)}</a>` : ""),
    insight?.reviewSearchUrl ? `<a href="${esc(safeExternalUrl(insight.reviewSearchUrl))}" target="_blank" rel="noopener">Vérifier les avis salariés</a>` : "",
  ].filter(Boolean).join(" · ");
  const ratingCards = ratings.map(rating => `<div class="employer-rating ${Number(rating.value) / Number(rating.best) < 0.6 ? "low" : ""}"><b>${Number(rating.value).toLocaleString("fr-FR", {maximumFractionDigits:1})}/${Number(rating.best).toLocaleString("fr-FR")}</b><span>${esc(rating.source)} · ${Number(rating.count).toLocaleString("fr-FR")} avis</span>${rating.checkedAt ? `<small>Vérifié le ${new Date(`${rating.checkedAt}T12:00:00`).toLocaleDateString("fr-FR")}</small>` : ""}</div>`).join("");
  return `<section class="panel company-insights ready"><div class="company-heading"><div><p class="eyebrow">Aide à la décision</p><h2>L’entreprise en bref</h2></div>${ratingCards ? `<div class="employer-ratings">${ratingCards}</div>` : ""}</div>${official ? `<p class="company-legal">${esc(official.legalName)}${official.siren ? ` · SIREN ${esc(official.siren)}` : ""}</p><div class="company-facts">${facts}</div>` : ""}${summary ? `<div class="company-summary"><h3>Contexte</h3><p>${esc(summary.text)}</p></div>` : ""}<p class="company-note">${ratings.length ? "Les notes restent séparées par plateforme et ne modifient pas automatiquement le score. Le nombre d’avis doit être pris en compte." : "Aucune note employeur publique et correctement sourcée n’a été trouvée."}</p>${sourceLinks ? `<p class="company-sources">Sources : ${sourceLinks}</p>` : ""}</section>`;
}

async function fetchCompanyInsight(item) {
  const [official, summary, detectedRating] = await Promise.all([
    fetchOfficialCompany(item.company).catch(() => null),
    fetchWikipediaCompany(item.company).catch(() => null),
    fetchEmployerRating(item.url).catch(() => null),
  ]);
  const verifiedRatings = verifiedEmployerRatings(item.company);
  return {
    version:COMPANY_INSIGHT_VERSION,
    company:item.company,
    official,
    summary,
    ratings:verifiedRatings.length ? verifiedRatings : (detectedRating ? [detectedRating] : []),
    reviewSearchUrl:`https://www.google.com/search?q=${encodeURIComponent(`${item.company} avis salariés note employeur`)}`,
    fetchedAt:new Date().toISOString(),
  };
}

async function enhanceCompanyView() {
  const [view, id] = location.hash.slice(1).split("/");
  if (view !== "application" || !id) return;
  const anchor = document.querySelector(".decision-detail");
  if (!anchor || document.querySelector(`.company-insights[data-id="${CSS.escape(id)}"]`)) return;
  const item = getItem(id);
  if (!item) return;
  const holder = document.createElement("div");
  holder.className = "company-insights-holder";
  holder.dataset.id = id;
  const cachedAt = Date.parse(item.companyInsight?.fetchedAt || "");
  const fresh = item.companyInsight?.version === COMPANY_INSIGHT_VERSION && Number.isFinite(cachedAt) && Date.now() - cachedAt < COMPANY_INSIGHT_MAX_AGE;
  holder.innerHTML = companyPanelHtml(fresh ? item.companyInsight : null, !fresh);
  holder.firstElementChild.dataset.id = id;
  anchor.insertAdjacentElement("afterend", holder);
  if (fresh) return;
  try {
    const insight = await fetchCompanyInsight(item);
    const list = apps();
    const stored = list.find((entry) => entry.id === id);
    if (stored) {
      stored.companyInsight = insight;
      save(list);
    }
    if (!holder.isConnected) return;
    holder.innerHTML = companyPanelHtml(insight);
    holder.firstElementChild.dataset.id = id;
  } catch {
    if (!holder.isConnected) return;
    holder.innerHTML = `<section class="panel company-insights ready" data-id="${esc(id)}"><p class="eyebrow">Aide à la décision</p><h2>L’entreprise en bref</h2><p>La recherche des données publiques est momentanément indisponible. L’analyse de compatibilité reste utilisable.</p><button class="button secondary small company-retry">Réessayer</button></section>`;
    holder.querySelector(".company-retry").onclick = () => { holder.remove(); enhanceCompanyView(); };
  }
}

const companyObserver = new MutationObserver(() => queueMicrotask(enhanceCompanyView));
companyObserver.observe(document.querySelector("#app"), {childList: true, subtree: true});
addEventListener("hashchange", () => setTimeout(enhanceCompanyView, 0));
setTimeout(enhanceCompanyView, 0);
