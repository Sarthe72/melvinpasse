import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const markup = readFileSync(new URL("../web/enhancements.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../web/styles.css", import.meta.url), "utf8");

assert.match(markup, /<td data-label="Poste"><a class="tracking-title-link" href="#application\/\$\{item\.id\}">/);
assert.doesNotMatch(markup, /<th><\/th><\/tr>/);
assert.deepEqual(
  [...markup.matchAll(/<td data-label="([^"]+)"/g)].map(match => match[1]),
  ["Entreprise", "Poste", "Analyse", "Score", "Statut", "Précision", "Mise à jour"],
);
assert.match(css, /\.tracking-table\{table-layout:fixed;min-width:0\}/);
assert.match(css, /@media\(max-width:900px\)[\s\S]*?\.tracking-table td::before\{content:attr\(data-label\)/);
assert.match(markup, /id="tracking-logo" type="file" accept="image\/png,image\/jpeg,image\/webp"/);
assert.match(markup, /found\.logo=logo;found\.events\.unshift\(\{type:"LOGO_CHANGED"/);
assert.match(markup, /const file=form\.get\("logo"\),logo=file\?\.size\?await trackingLogoData\(file\):""/);
assert.match(markup, /file\.size>5\*1024\*1024/);

console.log("Suivi responsive et logos : 9 contrôles réussis");
