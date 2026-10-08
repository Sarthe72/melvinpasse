function markdownToOfferText(value) {
  return String(value || "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^[ \t]*[·*][ \t]+/gm, "• ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

function decodeOfferEntities(value) {
  const text = String(value || "");
  if (!/&(?:#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]+);/i.test(text)) return text;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function cleanArcheOffer(result) {
  const raw = String(result?.text || "").replace(/\r/g, "");
  const lines = raw.split("\n");
  const descriptionIndex = lines.findIndex(line => /^\s*#{1,3}\s*Description\s*$/i.test(line));
  const headingIndex = lines.findIndex((line, index) => index <= descriptionIndex && /^\s*#\s+.+(?:H\s*\/\s*F|F\s*\/\s*H).*/i.test(line));
  const start = headingIndex >= 0 ? headingIndex : Math.max(0, descriptionIndex - 2);
  const endIndex = lines.findIndex((line, index) => index > start && (/^\s*\[?Postuler ici\]?/i.test(line) || /^\s*##\s+(?:Nos offres d['’]emplois|Pied de page)/i.test(line)));
  const selected = lines.slice(start, endIndex > start ? endIndex : lines.length).join("\n");
  const heading = headingIndex >= 0 ? lines[headingIndex].replace(/^\s*#\s*/, "").trim() : "";
  const title = heading.replace(/\s+[–—]\s+[^–—]+$/, "").trim() || result.title;
  const company = /\bSNEXI\s+recherche\b/i.test(selected) ? "SNEXI" : result.company;
  return {...result,title,company,text:markdownToOfferText(selected)};
}

function cleanOfferResult(result, rawUrl) {
  const decoded = {
    ...result,
    title: decodeOfferEntities(result?.title),
    company: decodeOfferEntities(result?.company),
    text: decodeOfferEntities(result?.text),
  };
  let host = "";
  try {
    host = new URL(rawUrl).hostname.replace(/^www\./, "");
  } catch {
    return decoded;
  }
  if (host === "arche.fr" || host === "sas-arche.com") return cleanArcheOffer(decoded);
  if (host === "talentup.com" && /\b(?:pour son client|notre client)\b/i.test(decoded.text)) {
    const recruiter = /VIDAL ASSOCIATES/i.test(decoded.text) ? "Vidal Associates" : decoded.company;
    return {
      ...decoded,
      title: /\/Vb16817U\//i.test(rawUrl) ? "Directeur d'entrepôt" : decoded.title,
      company: `Client non divulgué (via ${recruiter})`,
      text: markdownToOfferText(decoded.text),
    };
  }
  return decoded;
}

const readOfferLinkWithoutCleanup = readOfferLink;
readOfferLink = async function readCleanOfferLink(url) {
  let extractionUrl = url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.toLowerCase().endsWith(".icims.com")) {
      parsed.searchParams.set("in_iframe", "1");
      parsed.searchParams.delete("indeed-apply-token");
      extractionUrl = parsed.toString();
    }
  } catch {
    // The original reader will surface the invalid URL with its usual message.
  }
  return cleanOfferResult(await readOfferLinkWithoutCleanup(extractionUrl), url);
};
