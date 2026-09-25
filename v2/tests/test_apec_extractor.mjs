import assert from "node:assert/strict";
import { test } from "node:test";

let handler;
const nativeFetch = globalThis.fetch;
globalThis.Deno = { serve: (callback) => { handler = callback; } };
await import("../supabase/functions/extract-offer/index.ts");

const apecUrl = "https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre/179474342W?motsCles=directeur&lieux=589916&distance=15&selectedIndex=0&page=0";
const excerpt = "Rattaché au Directeur des Opérations, vous pilotez l'ensemble des activités opérationnelles, humaines et financières de la plateforme : Vous définissez la stratégie d'exploitation et garantissez les objectifs de performance et de qualité.";

function mockApecFetch(partnerDescription) {
  globalThis.fetch = async (target) => {
    const url = String(target);
    if (url.includes("/cms/webservices/offre/public")) return new Response("protected", { status: 403 });
    if (url.includes("/cms/webservices/rechercheOffre")) {
      return Response.json({ resultats: [{
        numeroOffre: "179474342W",
        intitule: "Directeur de site F/H",
        nomCommercial: "PARTNAIRE",
        lieuTexte: "Le Mans - 72",
        salaireTexte: "70 k€ brut annuel",
        texteOffre: `${excerpt} Vous enc...`,
      }] });
    }
    if (url.includes("www.partnaire.fr/nos-offres-d-emploi/")) {
      return new Response(`
        <h1 class="wp-block-post-title">Directeur de site (H/F) - Le Mans</h1>
        <div class="job-label job-label-ville"><span class="job-label-text">Le Mans</span></div>
        <div class="job-label job-label-remuneration">70 000&euro; - 78 000&euro;/an</div>
        <div class="job-label job-label-sm job-label-contrat">CDI</div>
        <section><h2>Description de l'offre</h2><p>${partnerDescription}</p></section>
        <section><h2>Profil souhaité</h2><p>${"Management logistique, pilotage de la performance et systèmes WMS. ".repeat(3)}</p></section>
      `, { headers: { "Content-Type": "text/html" } });
    }
    throw new Error(`Unexpected fetch ${url}`);
  };
}

async function extract() {
  const response = await handler(new Request("https://example.test/extract-offer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: apecUrl }),
  }));
  assert.equal(response.status, 200);
  return response.json();
}

test("lien Apec exact : retrouve l'offre complète vérifiée chez le recruteur", async () => {
  mockApecFetch(`${excerpt} ${"Gestion des flux, des équipes, du budget et des projets de transformation. ".repeat(8)}`);
  const result = await extract();
  assert.equal(result.source, "verified-recruiter");
  assert.equal(result.reference, "179474342W");
  assert.equal(result.company, "PARTNAIRE");
  assert.ok(result.sourceUrl.startsWith("https://www.partnaire.fr/"));
  assert.ok(result.text.length > 900);
  assert.ok(result.text.includes("Profil souhaité"));
  assert.ok(result.text.includes("70 000€ - 78 000€/an"));
  assert.notEqual(result.partial, true);
});

test("annonce recruteur différente : ne présente pas l'extrait Apec comme complet", async () => {
  mockApecFetch("Autre poste sans rapport. ".repeat(35));
  const result = await extract();
  assert.equal(result.source, "apec-search");
  assert.equal(result.partial, true);
  assert.ok(result.text.includes("Extrait des missions"));
  assert.ok(!result.text.includes("Profil souhaité"));
});

if (process.env.LIVE_APEC_TEST === "1") {
  test("l'annonce Apec publiée retrouve réellement le texte intégral chez Partnaire", async () => {
    globalThis.fetch = nativeFetch;
    const result = await extract();
    assert.equal(result.source, "verified-recruiter");
    assert.ok(result.text.length > 1000);
    assert.ok(result.text.includes("dialogue social"));
    assert.ok(result.text.includes("Lean Management"));
  });
}
