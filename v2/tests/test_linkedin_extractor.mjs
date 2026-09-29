import assert from "node:assert/strict";
import { test } from "node:test";

let handler;
const nativeFetch = globalThis.fetch;
globalThis.Deno = { serve: (callback) => { handler = callback; } };
await import("../supabase/functions/extract-offer/index.ts");

const offerUrl = "https://www.linkedin.com/jobs/view/4466540260/?trk=job_alert&refId=private-tracking";
const description = "Poste de directeur d'entrepôt en CDI à Allonnes. Missions et responsabilités : exploitation logistique, management des équipes, compétences en gestion budgétaire et amélioration de la performance. ".repeat(7);

async function extract(url = offerUrl) {
  const response = await handler(new Request("https://example.test/extract-offer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  }));
  return { status: response.status, body: await response.json() };
}

test("LinkedIn : extrait la fiche publique par identifiant sans les paramètres de suivi", async () => {
  globalThis.fetch = async (target) => {
    assert.equal(String(target), "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/4466540260");
    return new Response(`
      <h2 class="top-card-layout__title topcard__title">Directeur Entrepôt (F/H)</h2>
      <a class="topcard__org-name-link">Carrefour</a>
      <span class="topcard__flavor--bullet">Allonnes, Pays de la Loire, France</span>
      <div class="show-more-less-html__markup">${description}</div>
    `);
  };
  const result = await extract();
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.source, "linkedin-guest");
  assert.equal(result.body.title, "Directeur Entrepôt (F/H)");
  assert.equal(result.body.company, "Carrefour");
  assert.ok(result.body.text.includes("gestion budgétaire"));
  assert.ok(result.body.text.includes("Allonnes"));
  assert.equal(result.body.sourceUrl, "https://www.linkedin.com/jobs/view/4466540260/");
});

test("LinkedIn : refuse une fiche publique sans description vérifiable", async () => {
  globalThis.fetch = async () => new Response("<h2 class='topcard__title'>Directeur</h2><a class='topcard__org-name-link'>Carrefour</a>");
  const result = await extract();
  assert.equal(result.status, 422);
  assert.equal(result.body.error, "SOURCE_PROTECTED");
});

if (process.env.LIVE_LINKEDIN_TEST === "1") {
  test("LinkedIn public : extrait réellement l'offre Carrefour", async () => {
    globalThis.fetch = nativeFetch;
    const result = await extract();
    assert.equal(result.status, 200);
    assert.equal(result.body.source, "linkedin-guest");
    assert.equal(result.body.company, "Carrefour");
    assert.match(result.body.title, /Directeur Entrepôt/i);
    assert.ok(result.body.text.includes("Vos Missions"));
  });
}
