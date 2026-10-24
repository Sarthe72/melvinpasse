import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const markup = readFileSync(new URL("../web/enhancements.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../web/styles.css", import.meta.url), "utf8");

assert.match(markup, /<td data-label="Poste"><a class="tracking-title-link" href="#application\/\$\{item\.id\}">/);
assert.doesNotMatch(markup, /<th><\/th><\/tr>/);
assert.deepEqual(
  [...markup.matchAll(/<td data-label="([^"]+)"/g)].map(match => match[1]),
  ["Entreprise", "Démarche", "Candidature FR", "Poste", "Analyse", "Score", "Statut", "Date de candidature", "Précision", "Mise à jour"],
);
assert.match(markup, /<th>Entreprise<\/th><th>Démarche<\/th><th>CANDIDATURE FR<\/th><th>Poste<\/th>/);
assert.match(markup, /class="table-candidature-fr-date"[^>]+type="date"[^>]+candidatureFrAt/);
assert.match(markup, /item\.candidatureFrAt=value/);
assert.doesNotMatch(markup, /candidatureFrAt\s*[:=]\s*todayLocal\(\)/);
assert.match(markup, /<th>Date de candidature<\/th>/);
assert.match(markup, /class="tracking-applied-date-cell"/);
assert.doesNotMatch(markup, /class="table-applied-date"|name="appliedAt" type="date"|id="application-date"/);
assert.match(markup, /applicationDate\(b\)\.localeCompare\(applicationDate\(a\)\)/);
assert.match(markup, /item\.status==="ENTRETIEN"\|\|interviews\.length/);
assert.match(markup, /<tr class="interview-subrow"><td colspan="10">/);
assert.match(markup, /<span class="tracking-step">Candidature<\/span>/);
assert.match(markup, /<span class="tracking-step interview-step">Entretien<\/span>/);
assert.match(markup, /class="interview-form interview-new"/);
assert.match(markup, /class="interview-form interview-existing"/);
assert.match(markup, /item\.interviews\.push\(\{id:slug\(\),\.\.\.values\}\)/);
assert.match(markup, /item\.interviews=item\.interviews\.filter/);
assert.match(markup, /id="open-tracking-add"[^>]*>Ajouter une candidature/);
assert.match(markup, /id="tracking-add" class="panel tracking-add"/);
assert.match(markup, /class="tracking-note-details"><summary>Voir<\/summary>/);
assert.match(css, /\.tracking-table \.interview-subrow>td\{display:block/);
const dateLogic=markup.slice(markup.indexOf("const validApplicationDate="),markup.indexOf("const logoCompanyKey="));
const applicationDate=runInNewContext(`${dateLogic};applicationDate`);
assert.equal(applicationDate({trackingNote:"Envoyée sur Apec le 07/10/2026 ; confirmation visible."}),"2026-10-07");
assert.equal(applicationDate({trackingNote:"13/10/2026 : candidature envoyée sur Indeed."}),"2026-10-13");
assert.equal(applicationDate({trackingNote:"Candidature envoyée par e-mail à vb16817u@talentup.net le 08/10/2026."}),"2026-10-08");
assert.equal(applicationDate({trackingNote:"Candidature non envoyée le 07/10/2026."}),"");
assert.equal(applicationDate({trackingNote:"Refus reçu le 03/09/2026. Date de candidature inconnue."}),"");
assert.equal(applicationDate({trackingNote:"Candidature envoyée le 14/10/2026.",appliedAt:"2026-10-23"}),"2026-10-14");
assert.match(css, /\.tracking-table\{table-layout:fixed;min-width:0\}/);
assert.match(css, /@media\(max-width:900px\)[\s\S]*?\.tracking-table td::before\{content:attr\(data-label\)/);
assert.match(markup, /id="tracking-logo" type="file" accept="image\/png,image\/jpeg,image\/webp"/);
assert.match(markup, /found\.logo=logo;found\.events\.unshift\(\{type:"LOGO_CHANGED"/);
assert.match(markup, /const file=form\.get\("logo"\),logo=file\?\.size\?await trackingLogoData\(file\):""/);
assert.match(markup, /file\.size>5\*1024\*1024/);
const logoLogic=markup.slice(markup.indexOf("const logoCompanyKey="),markup.indexOf("const renderDashboard="));
const logoForTracking=runInNewContext(`${logoLogic};logoForTracking`);
const original={id:"first",company:"Partnaire",logo:"data:image/png;base64,abc"};
assert.equal(logoForTracking({id:"second",company:"Partnaire (client industriel)",logo:""},[original]),original.logo);
assert.equal(logoForTracking({id:"third",company:"LHH (client industriel)",logo:""},[original]),"");

console.log("Suivi responsive, logos et dates automatiques : contrôles réussis");
