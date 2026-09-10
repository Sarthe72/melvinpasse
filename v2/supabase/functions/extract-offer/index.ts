const cors = {
  "Access-Control-Allow-Origin": "https://sarthe72.github.io",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const blockedHosts = /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?)/i;
const protectedPage = /(just a moment|humans only|captcha|security check|unusual traffic|access denied|verify you are human)/i;
const jobSignals = /(missions?|responsabilit|profil|compétences?|experience|contrat|cdi|cdd|rémunération|salaire|poste)/gi;

function decode(value = "") {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
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

function companyFromHost(url: URL) {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "lmmhabitat.com") return "Le Mans Métropole Habitat";
  if (/(?:^|\.)(?:linkedin|indeed|glassdoor)\./i.test(host)) return "";
  return host.split(".")[0].replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
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
    let html = "";
    let source = "direct";
    try {
      html = await fetchPage(fetchUrl);
    } catch {
      source = "reader";
      html = await fetchPage(new URL(`https://r.jina.ai/http://${fetchUrl.host}${fetchUrl.pathname}${fetchUrl.search}`));
    }

    const structured = jsonLdJob(html);
    const structuredCompany = structured?.hiringOrganization as Record<string, unknown> | undefined;
    const structuredText = structured ? plainText(String(structured.description || "")) : "";
    const rawText = source === "reader"
      ? html.replace(/^Title:.*?Markdown Content:\s*/s, "").trim()
      : plainText(html);
    const text = structuredText.length >= 200 ? structuredText : rawText;
    const signalCount = new Set((text.match(jobSignals) || []).map((item) => item.toLowerCase())).size;
    const guardedProvider = /(?:^|\.)(?:linkedin|indeed|glassdoor)\./i.test(url.hostname);
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
