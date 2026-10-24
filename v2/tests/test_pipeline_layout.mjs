import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const markup = readFileSync(new URL("../web/enhancements.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../web/styles.css", import.meta.url), "utf8");
const mainRowMarkup=markup.slice(markup.indexOf("const rows=list.map"),markup.indexOf("const emptyLabel="));

assert.match(markup, /<td data-label="Poste"><a class="tracking-title-link" href="#application\/\$\{item\.id\}">/);
assert.doesNotMatch(markup, /<th><\/th><\/tr>/);
assert.deepEqual(
  [...mainRowMarkup.matchAll(/<td data-label="([^"]+)"/g)].map(match => match[1]),
  ["Entreprise", "Démarche", "Candidature FR", "Poste", "Statut", "Date de candidature", "Précision", "Mise à jour"],
);
assert.match(markup, /<th>Entreprise<\/th><th>Démarche<\/th>\$\{sortHeader\("fr","CANDIDATURE FR"\)\}<th>Poste<\/th><th>Statut<\/th>/);
assert.match(markup, /sortHeader\("applied","Date de candidature"\)/);
assert.match(markup, /sortHeader\("updated","Dernière mise à jour"\)/);
assert.match(markup, /class="tracking-sort-mobile"/);
assert.match(css, /@media\(max-width:900px\)[\s\S]*?\.tracking-sort-mobile\{display:flex/);
assert.match(markup, /aria-sort=/);
assert.doesNotMatch(markup, /<th>Analyse<\/th>|<th>Score<\/th>/);
assert.match(markup, /class="table-candidature-fr-date"[^>]+type="date"[^>]+candidatureFrAt/);
assert.match(markup, /item\.candidatureFrAt=value/);
assert.match(markup, /aria-label="Saisir ou modifier la date Candidature FR/);
assert.doesNotMatch(markup, /candidatureFrAt\s*[:=]\s*todayLocal\(\)/);
assert.match(markup, /\.tracking-sort/);
assert.match(markup, /class="tracking-applied-date-cell"/);
assert.doesNotMatch(markup, /class="table-applied-date"|name="appliedAt" type="date"|id="application-date"/);
assert.match(markup, /\.sort\(comparePipelineItems\)/);
assert.match(markup, /item\.status==="ENTRETIEN"\|\|interviews\.length/);
assert.match(markup, /<tr class="interview-subrow"><td class="interview-indent"/);
assert.match(markup, /data-label="Candidature FR" class="interview-date-cell">\$\{displayApplicationDate\(interview.date\)\}/);
assert.match(markup, /<td colspan="5"><details class="interview-panel"/);
assert.match(markup, /<details class="interview-panel" data-id=/);
assert.match(markup, /<summary class="interview-heading">/);
assert.doesNotMatch(markup, /<details class="interview-panel"[^>]*\sopen(?:\s|>)/);
assert.match(markup, /<span class="tracking-step">Candidature<\/span>/);
assert.match(markup, /<span class="tracking-step interview-step">Entretien<\/span>/);
assert.match(markup, /class="interview-form interview-new"/);
assert.match(markup, /class="interview-form interview-existing"/);
assert.match(markup, /item\.interviews\.push\(\{id:slug\(\),\.\.\.values\}\)/);
assert.match(markup, /item\.interviews=item\.interviews\.filter/);
assert.match(markup, /id="open-tracking-add"[^>]*>Ajouter une candidature/);
assert.match(markup, /id="tracking-add" class="panel tracking-add"/);
assert.match(markup, /class="tracking-note-details"><summary>Voir<\/summary>/);
assert.match(css, /\.tracking-table \.interview-subrow>td:last-child\{display:block/);
const dateLogic=markup.slice(markup.indexOf("const validApplicationDate="),markup.indexOf("const logoCompanyKey="));
const applicationDate=runInNewContext(`${dateLogic};applicationDate`);
const comparePipelineItems=runInNewContext(`${dateLogic};comparePipelineItems`);
const older={createdAt:"2026-10-10T10:00:00Z",appliedAt:"2026-10-10"};
const newlyAdded={createdAt:"2026-10-24T10:00:00Z"};
assert.ok(comparePipelineItems(newlyAdded,older)<0);
const first={createdAt:"2026-10-01T10:00:00Z",candidatureFrAt:"2026-10-11",appliedAt:"2026-10-05",events:[{date:"2026-10-21T10:00:00Z"}]};
const second={createdAt:"2026-10-02T10:00:00Z",candidatureFrAt:"2026-10-12",appliedAt:"2026-10-06",events:[{date:"2026-10-22T10:00:00Z"}]};
for(const key of ["fr","applied","updated"]){
  assert.ok(comparePipelineItems(second,first,{key,direction:"desc"})<0);
  assert.ok(comparePipelineItems(first,second,{key,direction:"asc"})<0);
}
assert.ok(comparePipelineItems(first,newlyAdded,{key:"fr",direction:"asc"})<0);
assert.ok(comparePipelineItems(first,newlyAdded,{key:"fr",direction:"desc"})<0);
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
