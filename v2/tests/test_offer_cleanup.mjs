import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../web/offer-cleanup.js", import.meta.url), "utf8");
const context = {
  URL,
  readOfferLink: async () => null,
  document: {
    createElement() {
      let value = "";
      return {
        set innerHTML(text) {
          value = text.replace(/&(?:eacute|ocirc|amp);/g, entity => ({
            "&eacute;": "é", "&ocirc;": "ô", "&amp;": "&",
          })[entity]);
        },
        get value() { return value; },
      };
    },
  },
};
vm.createContext(context);
vm.runInContext(source, context);

const original = {
  title: "Directeur d'Entrep&ocirc;t H/F",
  company: "Talentup",
  text: "**VIDAL ASSOCIATES recrute pour son client un Directeur Entrep&ocirc;t.** Le site pr&eacute;pare les commandes &amp; accompagne ses &eacute;quipes.",
};
const cleaned = context.cleanOfferResult(original, "https://talentup.com/Offre-Emploi/Vb16817U/Origine-19/directeur-det-039entrepot-h-f.html");
assert.equal(cleaned.title, "Directeur d'entrepôt");
assert.equal(cleaned.company, "Client non divulgué (via Vidal Associates)");
assert.match(cleaned.text, /Le site prépare les commandes & accompagne ses équipes/);
assert.ok(!cleaned.text.includes("**"));
assert.equal(original.title, "Directeur d'Entrep&ocirc;t H/F");
console.log("Nettoyage TalentUp : 5 contrôles réussis");
