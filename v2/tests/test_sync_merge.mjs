import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const source=readFileSync(new URL("../web/app.js",import.meta.url),"utf8");
const definition=source.match(/^function mergeApplications\(local,remote\).*$/m)?.[0];
assert.ok(definition,"La fusion des candidatures doit exister");
const merge=runInNewContext(`${definition};mergeApplications`);
const original={id:"a",createdAt:"2026-10-01T10:00:00Z",events:[{date:"2026-10-01T10:00:00Z"}],status:"A_ETUDIER"};
const updated={...original,events:[{date:"2026-10-07T10:00:00Z"}],status:"CANDIDATE"};
const other={...original,id:"b"};

assert.equal(merge([original],[updated])[0].status,"CANDIDATE","Le statut le plus récent gagne");
assert.equal(merge([updated],[original])[0].status,"CANDIDATE","L'ordre des appareils ne change pas le résultat");
assert.equal(merge([other],[updated]).length,2,"Les dossiers distincts sont conservés");
assert.ok(merge([updated],[{...original,deletedAt:"2026-10-08T10:00:00Z"}])[0].deletedAt,"Une suppression récente ne doit pas être annulée");
console.log("Fusion des candidatures : 4 contrôles réussis");
