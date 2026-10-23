const statusLabels={
  A_ETUDIER:"À étudier",
  A_CANDIDATER:"À candidater",
  CANDIDATE:"Candidature envoyée",
  RELANCE:"À relancer",
  ENTRETIEN:"Entretien",
  OFFRE:"Offre reçue",
  ACCEPTE:"Acceptée",
  REFUSE:"Refusée",
  ABANDONNE:"Abandonnée"
};
const tableStatusLabels={...statusLabels,CANDIDATE:"Envoyée"};
const validApplicationDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||""))&&!Number.isNaN(Date.parse(`${value}T12:00:00`));
const todayLocal=()=>new Date().toLocaleDateString("sv-SE");
function applicationDate(item){
  const firstSentence=String(item.trackingNote||"").split(/\.(?:\s+|$)/)[0];
  if(/(?:envoy[ée]|d[ée]pos[ée]e?|enregistr[ée]e?)/i.test(firstSentence)&&!/non envoy[ée]|aucun nouvel envoi/i.test(firstSentence)){
    const match=firstSentence.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
    if(match){
      const date=`${match[3]}-${match[2]}-${match[1]}`;
      if(validApplicationDate(date))return date;
    }
  }
  return validApplicationDate(item.appliedAt)?item.appliedAt:"";
}
const displayApplicationDate=date=>date?`${date.slice(8,10)}/${date.slice(5,7)}/${date.slice(0,4)}`:"Date inconnue";
const logoCompanyKey=company=>String(company||"").split("(")[0].trim().toLocaleLowerCase("fr-FR");
function logoForTracking(item,records){
  if(item.logo)return item.logo;
  const key=logoCompanyKey(item.company);
  if(key==="résidence le champ de l'ormeau")return "icons/champ-ormeau-logo.png";
  return key?records.find(other=>other.id!==item.id&&other.logo&&logoCompanyKey(other.company)===key)?.logo||"":"";
}

const renderDashboard=dashboard;
dashboard=function(){
  renderDashboard();
  const targets=["","A_CANDIDATER","ENTRETIEN","OFFRE"];
  document.querySelectorAll(".kpis article").forEach((card,index)=>{
    const filter=targets[index]||"";
    card.classList.add("kpi-link");
    card.setAttribute("role","link");
    card.setAttribute("tabindex","0");
    card.setAttribute("aria-label",filter?`Ouvrir les candidatures : ${statusLabels[filter]}`:"Ouvrir toutes les analyses");
    const open=()=>{location.hash=filter?`pipeline/${filter}`:"pipeline"};
    card.onclick=open;
    card.onkeydown=event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();open()}};
  });
};

pipeline=function(){
  const all=apps();
  let refreshed=false;
  all.forEach(item=>{
    if(item.trackingOnly)return;
    if(item.analysis?.compensationVersion!==1){
      item.analysis=analyze(item.offer);
      refreshed=true;
    }
  });
  if(refreshed)save(all);
  const requestedFilter=decodeURIComponent(location.hash.slice(1).split("/")[1]||"");
  const filter=STATUSES.includes(requestedFilter)?requestedFilter:"";
  const list=(filter?all.filter(item=>item.status===filter):all).sort((a,b)=>applicationDate(b).localeCompare(applicationDate(a))||(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0));
  const rows=list.map(item=>{const logo=logoForTracking(item,all);return`<tr>
    <td data-label="Entreprise"><div class="company-cell">${logo?`<img src="${esc(logo)}" alt="Logo de ${esc(item.company)}">`:`<span class="company-monogram" aria-hidden="true">${esc(item.company.slice(0,2).toUpperCase())}</span>`}<strong>${esc(item.company)}</strong></div></td>
    <td data-label="Candidature FR"><input class="table-candidature-fr-date" data-id="${esc(item.id)}" type="date" value="${validApplicationDate(item.candidatureFrAt)?esc(item.candidatureFrAt):""}" aria-label="Candidature FR pour ${esc(item.company)}" title="Date à renseigner par vous uniquement"></td>
    <td data-label="Poste"><a class="tracking-title-link" href="#application/${item.id}">${esc(item.title)}</a></td>
    <td data-label="Analyse">${item.trackingOnly?"<span class=\"muted\">Non analysée</span>":`<span class="verdict-pill ${item.analysis.recommendation==="GO"?"go":item.analysis.recommendation==="NO GO"?"nogo":"review"}">${esc(item.analysis.recommendation)}</span>`}</td>
    <td data-label="Score">${item.trackingOnly?"—":`<b>${item.analysis.overall}/100</b>`}</td>
    <td data-label="Statut"><select class="table-status" data-id="${esc(item.id)}" aria-label="Statut de ${esc(item.title)}">${STATUSES.map(status=>`<option value="${status}" ${status===item.status?"selected":""}>${esc(tableStatusLabels[status])}</option>`).join("")}</select></td>
    <td data-label="Date de candidature" class="tracking-applied-date-cell">${displayApplicationDate(applicationDate(item))}</td>
    <td data-label="Précision" class="tracking-note-cell">${esc(item.trackingNote||"—")}</td>
    <td data-label="Mise à jour" class="tracking-date-cell">${new Date(item.events[0]?.date||item.createdAt).toLocaleDateString("fr-FR")}</td>
  </tr>`}).join("");
  const emptyLabel=filter?`Aucune candidature avec le statut « ${statusLabels[filter]} ».`:"Aucune candidature suivie pour le moment.";
  const content=list.length?`<div class="tracking-table-wrap"><table class="tracking-table"><thead><tr><th>Entreprise</th><th>CANDIDATURE FR</th><th>Poste</th><th>Analyse</th><th>Score</th><th>Statut</th><th>Date de candidature</th><th>Précision</th><th>Dernière mise à jour</th></tr></thead><tbody>${rows}</tbody></table></div>`:`<div class="empty"><p>${esc(emptyLabel)}</p>${filter?`<a class="button secondary" href="#pipeline">Voir toutes les candidatures</a>`:`<a class="button" href="#dashboard">Analyser une annonce</a>`}</div>`;
  const filterNotice=filter?`<div class="active-filter"><span>Filtre : <b>${esc(statusLabels[filter])}</b></span><a href="#pipeline">Afficher tout</a></div>`:"";
  const addForm=`<details class="panel tracking-add"><summary>Ajouter un dossier déjà traité</summary><p>Pour suivre une candidature antérieure sans créer une fausse analyse.</p><form id="tracking-add-form" class="form"><label>Entreprise<input name="company" required></label><label>Poste<input name="title" required></label><label class="full">Lien de l’offre<input name="url" type="url" required placeholder="https://…"></label><label>Statut<select name="status">${STATUSES.map(status=>`<option value="${status}">${esc(statusLabels[status])}</option>`).join("")}</select></label><label class="full">Logo fourni par vous (facultatif)<input name="logo" type="file" accept="image/png,image/jpeg,image/webp"><small>Image PNG, JPG ou WebP, 5 Mo maximum.</small></label><label class="full">Précision factuelle<textarea name="trackingNote" rows="3" required placeholder="Ex. : envoyée sur Apec le 07/10/2026"></textarea></label><div class="full form-actions"><button class="button" type="submit">Ajouter au suivi</button></div></form></details>`;
  layout(filter?statusLabels[filter]:"Suivi des candidatures","Tableau de bord",`${filterNotice}<section class="panel tracking-panel">${content}</section>${filter?"":addForm}`,`<a class="button" href="#dashboard">Analyser une annonce</a>`);
  document.querySelectorAll(".table-status").forEach(select=>select.onchange=event=>{
    const records=apps(),item=records.find(entry=>entry.id===event.currentTarget.dataset.id);
    if(!item)return;
    item.status=event.currentTarget.value;
    if(item.status==="CANDIDATE"&&!applicationDate(item))item.appliedAt=todayLocal();
    item.events.unshift({type:"STATUS_CHANGED",date:new Date().toISOString()});
    save(records);
    toast(`Statut : ${statusLabels[item.status]}`);
  });
  document.querySelectorAll(".table-candidature-fr-date").forEach(input=>input.onchange=event=>{
    const value=event.currentTarget.value;
    if(value&&!validApplicationDate(value)){toast("Choisissez une date valide");return}
    const records=rawApps(),item=records.find(entry=>entry.id===event.currentTarget.dataset.id);
    if(!item)return;
    item.candidatureFrAt=value;
    item.events.unshift({type:"CANDIDATURE_FR_DATE_CHANGED",date:new Date().toISOString()});
    save(records);
    toast(value?"Date CANDIDATURE FR enregistrée":"Date CANDIDATURE FR effacée");
  });
  document.querySelector("#tracking-add-form")?.addEventListener("submit",async event=>{
    event.preventDefault();
    const form=new FormData(event.currentTarget),url=String(form.get("url")).trim();
    if(!/^https?:\/\//i.test(url)){toast("Utilisez un lien http ou https");return}
    if(apps().some(item=>item.url===url)){toast("Cette offre figure déjà dans le suivi");return}
    const file=form.get("logo"),logo=file?.size?await trackingLogoData(file):"";
    if(logo===null)return;
    const date=new Date().toISOString();
    const item={id:slug(),company:String(form.get("company")).trim(),title:String(form.get("title")).trim(),url,offer:"",logo,status:String(form.get("status")),trackingOnly:true,trackingNote:String(form.get("trackingNote")).trim(),createdAt:date,events:[{type:"ADDED_TO_TRACKING",date}]};
    save([item,...rawApps()]);
    route();
    toast("Dossier ajouté au suivi");
  });
};

async function trackingLogoData(file){
  if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>5*1024*1024){toast("Choisissez un logo PNG, JPG ou WebP de 5 Mo maximum.");return null}
  try{return await imageData(file)}catch{toast("Impossible de lire ce logo. Essayez une autre image.");return null}
}

const renderAnalyzedApplication=application;
application=function(id){
  const item=getItem(id);
  if(!item?.trackingOnly){
    renderAnalyzedApplication(id);
  }else{
    const logo=logoForTracking(item,apps());
    layout(item.title,item.company,`<section class="panel tracking-detail"><p class="eyebrow">Dossier de suivi</p><h2>${esc(item.title)}</h2><p><strong>${esc(item.company)}</strong> · <a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Voir l’offre d’origine</a></p><p>Ce dossier a été ajouté au suivi sans analyse automatique : aucun score ni CV personnalisé n’a été généré.</p><div class="tracking-logo-editor">${logo?`<img src="${esc(logo)}" alt="Logo de ${esc(item.company)}">`:`<span class="company-monogram" aria-hidden="true">${esc(item.company.slice(0,2).toUpperCase())}</span>`}<label>Logo de l’entreprise<input id="tracking-logo" type="file" accept="image/png,image/jpeg,image/webp"><small>Ajoutez ou remplacez le logo que vous avez fourni. La modification se synchronise sur vos appareils.</small></label></div><label>Statut<select id="status">${STATUSES.map(status=>`<option value="${status}" ${item.status===status?"selected":""}>${esc(statusLabels[status])}</option>`).join("")}</select></label><label>Précision factuelle<textarea id="tracking-note" rows="4">${esc(item.trackingNote||"")}</textarea></label><p class="muted">Les modifications sont enregistrées automatiquement.</p><button class="button danger" id="remove">Supprimer ce dossier</button></section>`,`<a class="button secondary" href="#pipeline">Retour au suivi</a>`);
    document.querySelector("#tracking-logo").onchange=async event=>{const file=event.target.files?.[0];if(!file)return;const logo=await trackingLogoData(file);if(!logo)return;const records=rawApps(),found=records.find(entry=>entry.id===id);if(!found)return;found.logo=logo;found.events.unshift({type:"LOGO_CHANGED",date:new Date().toISOString()});save(records);application(id);toast("Logo mis à jour")};
    document.querySelector("#status").onchange=event=>{const records=rawApps(),found=records.find(entry=>entry.id===id);found.status=event.target.value;if(found.status==="CANDIDATE"&&!applicationDate(found))found.appliedAt=todayLocal();found.events.unshift({type:"STATUS_CHANGED",date:new Date().toISOString()});save(records);toast(`Statut : ${statusLabels[found.status]}`)};
    document.querySelector("#tracking-note").onchange=event=>{const records=rawApps(),found=records.find(entry=>entry.id===id);found.trackingNote=event.target.value.trim();found.events.unshift({type:"NOTE_CHANGED",date:new Date().toISOString()});save(records);toast("Précision mise à jour")};
  }
  const statusLabel=document.querySelector("#status")?.closest("label");
  if(statusLabel){const date=document.createElement("p");date.className="application-date-editor";date.textContent=`Date de candidature : ${displayApplicationDate(applicationDate(item))}`;statusLabel.after(date)}
  const remove=document.querySelector("#remove");
  if(remove)remove.onclick=()=>{if(!confirm("Supprimer ce dossier de tous vos appareils ?"))return;const records=rawApps(),found=records.find(entry=>entry.id===id);if(!found)return;found.deletedAt=new Date().toISOString();save(records);location.hash="pipeline"};
};
document.addEventListener("click",event=>{
  if(!event.target.closest("#candidate-now, #candidate-anyway"))return;
  const id=location.hash.slice(1).split("/")[1],records=rawApps(),item=records.find(entry=>entry.id===id);
  if(item&&!applicationDate(item)){item.appliedAt=todayLocal();save(records)}
},true);
document.addEventListener("change",event=>{
  if(event.target.id!=="status")return;
  const id=location.hash.slice(1).split("/")[1],records=rawApps(),item=records.find(entry=>entry.id===id);
  if(item?.status==="CANDIDATE"&&!applicationDate(item)){item.appliedAt=todayLocal();save(records)}
});
