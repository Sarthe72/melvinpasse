const cors = {
  "Access-Control-Allow-Origin": "https://sarthe72.github.io",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const blockedHosts = /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?)/i;
const protectedPage = /(just a moment|humans only|captcha|security check|unusual traffic|access denied|verify you are human)/i;
const jobSignals = /(missions?|responsabilit|profil|compétences?|experience|contrat|cdi|cdd|rémunération|salaire|poste)/gi;
const verifiedApecAlternatives: Record<string, string> = {
  "179474342W": "https://www.partnaire.fr/nos-offres-d-emploi/le-mans-directeur-de-site-h-f-2026-09-10-78707/",
};

function decode(value = "") {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&euro;/gi, "€")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function plainText(html = "") {
  return decode(html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<br\s*\/?>|<\/p>|<\/li>|<\/h\d>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function findJobPosting(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJobPosting(item);
      if (found) return found;
    }
    return null;
  }
  const record = value as Record<string, unknown>;
  const type = record["@type"];
  if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) return record;
  for (const child of Object.values(record)) {
    const found = findJobPosting(child);
    if (found) return found;
  }
  return null;
}

function jsonLdJob(html: string) {
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const found = findJobPosting(JSON.parse(decode(match[1]).trim()));
      if (found) return found;
    } catch {
      // Some pages contain unrelated or malformed JSON-LD; continue with the next block.
    }
  }
  return null;
}

function meta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decode(match[1]).trim();
  }
  return "";
}

function titleFromUrl(url: URL) {
  const hash = decodeURIComponent(url.hash.slice(1)).trim();
  if (hash) return hash.split(/\s+CDI\s*\/|\s+CDD\s*\/|\s*\/\s*/i)[0].trim();
  const linkedin = decodeURIComponent(url.pathname).match(/\/jobs\/view\/(.+?)(?:-at-.+)?-\d+\/?$/i)?.[1];
  return linkedin?.replace(/-/g, " ") || "";
}

function selectedOfferText(html: string, url: URL, requestedTitle: string) {
  if (url.hostname.replace(/^www\./, "") !== "lmmhabitat.com" || !requestedTitle) return "";
  const normalizedTitle = requestedTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const panels = html.split(/<div\s+class=["']panel panel-default["']>/i).slice(1);
  const panel = panels.find((candidate) => plainText(candidate)
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .includes(normalizedTitle));
  if (!panel) return "";
  const offerOnly = panel.split(/<div\s+class=["']publications-links["']>/i)[0];
  return plainText(offerOnly).replace(/\bTélécharger la fiche de poste\b[\s\S]*$/i, "").trim();
}

function companyFromHost(url: URL) {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "lmmhabitat.com") return "Le Mans Métropole Habitat";
  if (host.endsWith(".icims.com") && host.includes("carrefour")) return "Carrefour";
  if (/(?:^|\.)(?:linkedin|indeed|glassdoor)\./i.test(host)) return "";
  return host.split(".")[0].replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function icimsOffer(html: string, url: URL) {
  if (!url.hostname.toLowerCase().endsWith(".icims.com")) return null;
  const text = meta(html, "og:description") || meta(html, "description");
  if (text.length < 250) return null;
  const firstLine = text.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "";
  const pageTitle = meta(html, "og:title").split(/\s+in\s+.+?\s*\|/i)[0].trim();
  const embeddedCompany = html.match(/"companyName"\s*:\s*"([^"]+)"/i)?.[1] || "";
  return {
    title: firstLine || pageTitle || titleFromUrl(url) || "Annonce à analyser",
    company: decode(embeddedCompany).replace(/\s+France$/i, "").trim() || companyFromHost(url),
    text: decode(text).trim(),
    source: "icims",
  };
}

function apecOfferNumber(url: URL) {
  if (!/(?:^|\.)apec\.fr$/i.test(url.hostname)) return "";
  return url.pathname.match(/detail-offre\/(\d+[A-Z]?)/i)?.[1] || "";
}

function firstNestedString(value: unknown, keys: string[]): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const direct = record[key];
    if (typeof direct === "string" && direct.trim()) return direct.trim();
  }
  for (const child of Object.values(record)) {
    const found = firstNestedString(child, keys);
    if (found) return found;
  }
  return "";
}

function collectApecText(value: unknown, parts: string[] = [], seen = new Set<unknown>()) {
  if (!value || typeof value !== "object" || seen.has(value)) return parts;
  seen.add(value);
  const record = value as Record<string, unknown>;
  for (const [key, child] of Object.entries(record)) {
    if (typeof child === "string" && /(texte|description|descriptif|profil|mission|competence|salaire|lieu|contrat)/i.test(key)) {
      const text = plainText(child);
      if (text.length >= 3 && !parts.includes(text)) parts.push(text);
    } else if (child && typeof child === "object") {
      collectApecText(child, parts, seen);
    }
  }
  return parts;
}

async function fetchApecOffer(url: URL) {
  const offerNumber = apecOfferNumber(url);
  if (!offerNumber) return null;
  const endpoint = new URL("https://www.apec.fr/cms/webservices/offre/public");
  endpoint.searchParams.set("numeroOffre", offerNumber);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "fr-FR,fr;q=0.9",
        "Referer": url.toString(),
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
      },
    });
    if (!response.ok) throw new Error(`APEC HTTP ${response.status}`);
    const payload = await response.json();
    const title = firstNestedString(payload, ["intitule", "title", "intituleOffre"]);
    const company = firstNestedString(payload, ["nomCommercial", "nomEntreprise", "raisonSociale", "company"]);
    const text = collectApecText(payload).join("\n").slice(0, 120_000);
    if (!title || text.length < 250 || protectedPage.test(text.slice(0, 2500))) throw new Error("APEC contenu protégé");
    return { title, company: company || "Entreprise confidentielle", text, source: "apec-api", reference: offerNumber };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchApecSearchCard(url: URL) {
  const offerNumber = apecOfferNumber(url);
  if (!offerNumber) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch("https://www.apec.fr/cms/webservices/rechercheOffre", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
      },
      body: JSON.stringify({
        numeroOffre: offerNumber,
        motsCles: "",
        typeClient: "CADRE",
        activeFiltre: true,
        sorts: [{ type: "DATE", direction: "DESCENDING" }],
        pagination: { range: 1, startIndex: 0 },
      }),
    });
    if (!response.ok) throw new Error(`APEC recherche HTTP ${response.status}`);
    const payload = await response.json();
    const item = Array.isArray(payload?.resultats)
      ? payload.resultats.find((candidate: Record<string, unknown>) => candidate?.numeroOffre === offerNumber)
      : null;
    if (!item) throw new Error("Offre APEC introuvable");
    const title = String(item.intitule || "Annonce APEC").trim();
    const company = String(item.nomCommercial || "Entreprise confidentielle").trim();
    const excerpt = item.texteOffre ? plainText(String(item.texteOffre)) : "";
    const text = [
      `Poste : ${title}`,
      `Entreprise : ${company}`,
      item.lieuTexte ? `Lieu : ${item.lieuTexte}` : "",
      item.salaireTexte ? `Salaire : ${item.salaireTexte}` : "",
      excerpt ? `Extrait des missions : ${excerpt}` : "",
      `Référence APEC : ${offerNumber}`,
    ].filter(Boolean).join("\n");
    if (text.length < 250) throw new Error("Résumé APEC incomplet");
    return { title, company, text, excerpt, source: "apec-search", reference: offerNumber, partial: true };
  } finally {
    clearTimeout(timer);
  }
}

function partnaireOffer(html: string, url: URL) {
  if (url.hostname.replace(/^www\./, "") !== "partnaire.fr") return null;
  const section = (heading: string) => {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = html.match(new RegExp(`<h2>\\s*${escaped}\\s*<\\/h2>([\\s\\S]*?)<\\/section>`, "i"));
    return match ? plainText(match[1]) : "";
  };
  const description = section("Description de l'offre");
  const wantedProfile = section("Profil souhaité");
  if (description.length < 500 || wantedProfile.length < 100) return null;
  const salary = plainText(html.match(/class=["']job-label job-label-remuneration["']>([\s\S]*?)<\/div>/i)?.[1] || "");
  const contract = plainText(html.match(/class=["']job-label job-label-sm job-label-contrat["']>([\s\S]*?)<\/div>/i)?.[1] || "");
  const location = plainText(html.match(/class=["']job-label-text["']>([\s\S]*?)<\/span>/i)?.[1] || "");
  return { description, wantedProfile, salary, contract, location };
}

function sameApecOffer(summary: { title: string; company: string; excerpt: string }, fullText: string) {
  const normalize = (value: string) => value.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  return /partnaire/i.test(summary.company)
    && /directeur de site/i.test(normalize(summary.title))
    && normalize(fullText).includes(normalize(summary.excerpt.slice(0, 150)));
}

async function fetchVerifiedApecAlternative(summary: { title: string; company: string; excerpt: string; reference: string }) {
  const sourceUrl = verifiedApecAlternatives[summary.reference];
  if (!sourceUrl) return null;
  const pageUrl = new URL(sourceUrl);
  const content = partnaireOffer(await fetchPage(pageUrl), pageUrl);
  if (!content || !sameApecOffer(summary, content.description)) return null;
  const text = [
    `Poste : ${summary.title}`,
    `Recruteur : ${summary.company}`,
    content.location ? `Lieu : ${content.location}` : "",
    content.contract ? `Contrat : ${content.contract}` : "",
    content.salary ? `Rémunération affichée par le recruteur : ${content.salary}` : "",
    `Description de l'offre : ${content.description}`,
    `Profil souhaité : ${content.wantedProfile}`,
    `Référence APEC : ${summary.reference}`,
  ].filter(Boolean).join("\n");
  return { title: summary.title, company: summary.company, text, source: "verified-recruiter", sourceUrl, reference: summary.reference };
}

function titleMatches(text: string, title: string) {
  const words = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/).filter((word) => word.length >= 4);
  const haystack = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return words.length >= 2 && words.filter((word) => haystack.includes(word)).length >= Math.min(2, words.length);
}

async function fetchPage(url: URL) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.6",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const size = Number(response.headers.get("content-length") || 0);
    if (size > 3_000_000) throw new Error("Page trop volumineuse");
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Méthode refusée" }), { status: 405, headers: cors });

  try {
    const body = await request.json();
    const url = new URL(String(body?.url || ""));
    if (!/^https?:$/.test(url.protocol) || blockedHosts.test(url.hostname) || url.hostname.endsWith(".local")) {
      throw new Error("Adresse non autorisée");
    }

    const requestedTitle = titleFromUrl(url);
    const fetchUrl = new URL(url.toString());
    fetchUrl.hash = "";
    if (fetchUrl.hostname.toLowerCase().endsWith(".icims.com")) {
      fetchUrl.searchParams.set("in_iframe", "1");
      fetchUrl.searchParams.delete("indeed-apply-token");
    }
    if (apecOfferNumber(url)) {
      try {
        const offer = await fetchApecOffer(url);
        if (offer) return new Response(JSON.stringify(offer), { headers: cors });
      } catch {
        // The detail endpoint is protected by DataDome from some server networks.
      }
      let summary = null;
      try {
        summary = await fetchApecSearchCard(url);
      } catch {
        // Retain the generic fallbacks below if APEC search is temporarily unavailable.
      }
      if (summary) {
        try {
          const fullOffer = await fetchVerifiedApecAlternative(summary);
          if (fullOffer) return new Response(JSON.stringify(fullOffer), { headers: cors });
        } catch {
          // The verified recruiter page may change or disappear; keep the APEC excerpt.
        }
        return new Response(JSON.stringify(summary), { headers: cors });
      }
    }
    let html = "";
    let source = "direct";
    try {
      html = await fetchPage(fetchUrl);
    } catch {
      source = "reader";
      html = await fetchPage(new URL(`https://r.jina.ai/http://${fetchUrl.host}${fetchUrl.pathname}${fetchUrl.search}`));
    }

    const icims = source === "direct" ? icimsOffer(html, url) : null;
    if (icims) return new Response(JSON.stringify(icims), { headers: cors });

    const structured = jsonLdJob(html);
    const structuredCompany = structured?.hiringOrganization as Record<string, unknown> | undefined;
    const structuredText = structured ? plainText(String(structured.description || "")) : "";
    const focusedText = source === "direct" ? selectedOfferText(html, url, requestedTitle) : "";
    const rawText = focusedText || (source === "reader"
      ? html.replace(/^Title:.*?Markdown Content:\s*/s, "").trim()
      : plainText(html));
    const text = structuredText.length >= 200 ? structuredText : rawText;
    const signalCount = new Set((text.match(jobSignals) || []).map((item) => item.toLowerCase())).size;
    const guardedProvider = /(?:^|\.)(?:linkedin|indeed|glassdoor|apec)\./i.test(url.hostname);
    const unverifiedListing = guardedProvider && !structured && (!requestedTitle || !titleMatches(text, requestedTitle));
    if (protectedPage.test(text.slice(0, 2500)) || text.length < 250 || signalCount < 3 || unverifiedListing) {
      return new Response(JSON.stringify({ error: "SOURCE_PROTECTED", provider: url.hostname }), { status: 422, headers: cors });
    }

    const title = String(structured?.title || requestedTitle || meta(html, "og:title") || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "Annonce à analyser").trim();
    const company = String(structuredCompany?.name || meta(html, "og:site_name") || companyFromHost(url)).trim();
    return new Response(JSON.stringify({ title: decode(title), company: decode(company), text: text.slice(0, 120_000), source }), { headers: cors });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Lecture impossible" }), { status: 400, headers: cors });
  }
});
