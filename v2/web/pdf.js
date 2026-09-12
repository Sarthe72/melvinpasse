const buildApplicationLetter=item=>{const proofs=item.analysis.evidence.slice(0,2).map(proof=>`${proof.title} : ${proof.facts.join(" ; ")}`);const matches=item.analysis.matches.slice(0,4).join(", ")||"le pilotage opérationnel";return`Madame, Monsieur,

Votre recherche d’un(e) ${item.title} au sein de ${item.company} retient mon attention, notamment pour : ${matches}.

${profile.summary}

Deux réalisations issues de mon parcours :
${proofs.map(value=>`- ${value}`).join("\n")}

${profile.signature}

Je serais heureux d’échanger sur les priorités concrètes du poste.

Bien cordialement,`};

function printThenReturn(id){const back=()=>{removeEventListener("afterprint",back);location.hash=`kit/${id}`};addEventListener("afterprint",back,{once:true});setTimeout(()=>window.print(),180)}

async function letter(id){const item=getItem(id);if(!item)return dashboard();const content=buildApplicationLetter(item),colors=await palette(item.logo),scheme=cvHarmoniousColors(colors.primary);layout(item.title,"Lettre de motivation · PDF",`<div class="actions"><button class="button" id="print-letter">Télécharger en PDF</button><a class="button secondary" href="#kit/${id}">Retour au kit</a></div><div class="letter-screen"><article class="letter-page" style="--letter-accent:${scheme.accent};--letter-deep:${scheme.deep};--letter-light:${scheme.light}"><img class="letter-watermark" src="${item.logo}" alt=""><header><div><strong>${esc(profile.identity.name)}</strong><small>${esc(profile.identity.location)}</small></div><span>${esc(profile.identity.email)}<br>${esc(profile.identity.phone)}<br>${esc(profile.identity.linkedin)}</span></header><div class="letter-recipient"><b>${esc(item.company)}</b><span>Candidature au poste de ${esc(item.title)}</span></div><div class="letter-body">${esc(content).replaceAll("\n","<br>")}</div><footer>${esc(profile.identity.name)}</footer></article></div>`);document.querySelector("#print-letter").onclick=()=>window.print();if(sessionStorage.getItem("cv-melvin-auto-pdf")===`letter/${id}`){sessionStorage.removeItem("cv-melvin-auto-pdf");printThenReturn(id)}}

const renderKit=kit;kit=function(id){renderKit(id);const grid=document.querySelector(".content-grid");if(!grid)return;const downloads=document.createElement("section");downloads.className="panel pdf-downloads";downloads.innerHTML=`<div><p class="eyebrow">Documents prêts</p><h2>Télécharger en PDF</h2><p>Les deux documents sont préparés au format A4.</p></div><div class="pdf-actions"><button class="button" id="pdf-cv">CV personnalisé</button><button class="button secondary" id="pdf-letter">Lettre de motivation</button></div>`;grid.before(downloads);document.querySelector("#pdf-cv").onclick=()=>{sessionStorage.setItem("cv-melvin-auto-pdf",`cv/${id}`);location.hash=`cv/${id}`};document.querySelector("#pdf-letter").onclick=()=>{sessionStorage.setItem("cv-melvin-auto-pdf",`letter/${id}`);location.hash=`letter/${id}`}};

const renderCv=cv;cv=async function(id){await renderCv(id);if(sessionStorage.getItem("cv-melvin-auto-pdf")===`cv/${id}`){sessionStorage.removeItem("cv-melvin-auto-pdf");printThenReturn(id)}};

const renderRoute=route;route=function(){const [view,id]=location.hash.slice(1).split("/");if(view==="letter")return letter(id);renderRoute()};
