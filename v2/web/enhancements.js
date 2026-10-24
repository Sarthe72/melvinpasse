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
const openInterviewPanel=(id,interviewId="new")=>document.querySelectorAll(".interview-panel").forEach(panel=>{if(panel.dataset.id===id&&panel.dataset.interviewId===interviewId)panel.open=true});
function interviewRow(item,interview,index){
  return `<tr class="interview-subrow"><td class="interview-indent" aria-hidden="true"></td><td data-label="Démarche"><span class="tracking-step interview-step">Entretien ${index+1}</span></td><td data-label="Candidature FR" class="interview-date-cell">${displayApplicationDate(interview.date)}</td><td colspan="5"><details class="interview-panel" data-id="${esc(item.id)}" data-interview-id="${esc(interview.id)}"><summary class="interview-heading"><strong>Entretien ${index+1} · ${esc(item.company)}</strong><span>Voir / modifier</span></summary><form class="interview-form interview-existing" data-id="${esc(item.id)}" data-interview-id="${esc(interview.id)}"><label>Date<input name="date" type="date" required value="${esc(interview.date||"")}"></label><label>Heure<input name="time" type="time" value="${esc(interview.time||"")}"></label><label>Interlocuteur(s)<input name="people" value="${esc(interview.people||"")}"></label><label class="interview-note">Notes<textarea name="note" rows="2">${esc(interview.note||"")}</textarea></label><div class="interview-actions"><button class="button secondary" type="submit">Enregistrer</button><button class="button secondary interview-delete" type="button" data-id="${esc(item.id)}" data-interview-id="${esc(interview.id)}">Supprimer</button></div></form></details></td></tr>`;
}
function interviewAddRow(item){
  return `<tr class="interview-subrow"><td class="interview-indent" aria-hidden="true"></td><td data-label="Démarche"><span class="tracking-step interview-step">Entretien</span></td><td data-label="Candidature FR" class="interview-date-cell">—</td><td colspan="5"><details class="interview-panel" data-id="${esc(item.id)}" data-interview-id="new"><summary class="interview-heading"><strong>+ Ajouter un entretien</strong></summary><form class="interview-form interview-new" data-id="${esc(item.id)}"><label>Date<input name="date" type="date" required></label><label>Heure<input name="time" type="time"></label><label>Interlocuteur(s)<input name="people"></label><label class="interview-note">Notes<textarea name="note" rows="2"></textarea></label><div class="interview-actions"><button class="button" type="submit">Ajouter cet entretien</button></div></form></details></td></tr>`;
}
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
  const rows=list.map(item=>{const logo=logoForTracking(item,all),interviews=Array.isArray(item.interviews)?item.interviews:[];return`<tr>
    <td data-label="Entreprise"><div class="company-cell">${logo?`<img src="${esc(logo)}" alt="Logo de ${esc(item.company)}">`:`<span class="company-monogram" aria-hidden="true">${esc(item.company.slice(0,2).toUpperCase())}</span>`}<strong>${esc(item.company)}</strong></div></td>
    <td data-label="Démarche"><span class="tracking-step">Candidature</span></td>
    <td data-label="Candidature FR"><input class="table-candidature-fr-date" data-id="${esc(item.id)}" type="date" value="${validApplicationDate(item.candidatureFrAt)?esc(item.candidatureFrAt):""}" aria-label="Saisir ou modifier la date Candidature FR pour ${esc(item.company)}" title="Cliquez pour saisir ou modifier cette date"></td>
    <td data-label="Poste"><a class="tracking-title-link" href="#application/${item.id}">${esc(item.title)}</a></td>
    <td data-label="Statut"><select class="table-status" data-id="${esc(item.id)}" aria-label="Statut de ${esc(item.title)}">${STATUSES.map(status=>`<option value="${status}" ${status===item.status?"selected":""}>${esc(tableStatusLabels[status])}</option>`).join("")}</select></td>
    <td data-label="Date de candidature" class="tracking-applied-date-cell">${displayApplicationDate(applicationDate(item))}</td>
    <td data-label="Précision" class="tracking-note-cell">${item.trackingNote?`<details class="tracking-note-details"><summary>Voir</summary><div>${esc(item.trackingNote)}</div></details>`:"—"}</td>
    <td data-label="Mise à jour" class="tracking-date-cell">${new Date(item.events[0]?.date||item.createdAt).toLocaleDateString("fr-FR")}</td>
  </tr>${interviews.map((interview,index)=>interviewRow(item,interview,index)).join("")}${item.status==="ENTRETIEN"||interviews.length?interviewAddRow(item):""}`}).join("");
  const emptyLabel=filter?`Aucune candidature avec le statut « ${statusLabels[filter]} ».`:"Aucune candidature suivie pour le moment.";
  const content=list.length?`<div class="tracking-table-wrap"><table class="tracking-table"><thead><tr><th>Entreprise</th><th>Démarche</th><th>CANDIDATURE FR</th><th>Poste</th><th>Statut</th><th>Date de candidature</th><th>Précision</th><th>Dernière mise à jour</th></tr></thead><tbody>${rows}</tbody></table></div>`:`<div class="empty"><p>${esc(emptyLabel)}</p>${filter?`<a class="button secondary" href="#pipeline">Voir toutes les candidatures</a>`:`<a class="button" href="#dashboard">Analyser une annonce</a>`}</div>`;
  const filterNotice=filter?`<div class="active-filter"><span>Filtre : <b>${esc(statusLabels[filter])}</b></span><a href="#pipeline">Afficher tout</a></div>`:"";
  const addForm=`<details id="tracking-add" class="panel tracking-add"><summary>Ajouter une candidature manuellement</summary><p>Pour suivre une candidature sans créer une analyse automatique.</p><form id="tracking-add-form" class="form"><label>Entreprise<input name="company" required></label><label>Poste<input name="title" required></label><label class="full">Lien de l’offre (facultatif)<input name="url" type="url" placeholder="https://…"></label><label>Statut<select name="status">${STATUSES.map(status=>`<option value="${status}">${esc(statusLabels[status])}</option>`).join("")}</select></label><label class="full">Logo fourni par vous (facultatif)<input name="logo" type="file" accept="image/png,image/jpeg,image/webp"><small>Image PNG, JPG ou WebP, 5 Mo maximum.</small></label><label class="full">Précision factuelle (facultatif)<textarea name="trackingNote" rows="3" placeholder="Ex. : envoyée sur Apec le 07/10/2026"></textarea></label><div class="full form-actions"><button class="button" type="submit">Ajouter au suivi</button></div></form></details>`;
  layout(filter?statusLabels[filter]:"Suivi des candidatures","Tableau de bord",`${filterNotice}<section class="panel tracking-panel">${content}</section>${filter?"":addForm}`,`<button class="button secondary" id="open-tracking-add" type="button">Ajouter une candidature</button><a class="button" href="#dashboard">Analyser une annonce</a>`);
  document.querySelector("#open-tracking-add")?.addEventListener("click",()=>{if(filter){location.hash="pipeline";setTimeout(()=>document.querySelector("#open-tracking-add")?.click(),0);return}const details=document.querySelector("#tracking-add");details.open=true;details.scrollIntoView({behavior:"smooth",block:"start"});details.querySelector('[name="company"]').focus()});
  document.querySelectorAll(".table-status").forEach(select=>select.onchange=event=>{
    const records=apps(),item=records.find(entry=>entry.id===event.currentTarget.dataset.id);
    if(!item)return;
    item.status=event.currentTarget.value;
    if(item.status==="CANDIDATE"&&!applicationDate(item))item.appliedAt=todayLocal();
    item.events.unshift({type:"STATUS_CHANGED",date:new Date().toISOString()});
    save(records);
    pipeline();
    if(item.status==="ENTRETIEN")openInterviewPanel(item.id);
    toast(`Statut : ${statusLabels[item.status]}`);
  });
  document.querySelectorAll(".interview-form").forEach(form=>form.addEventListener("submit",event=>{
    event.preventDefault();
    const data=new FormData(form),date=String(data.get("date")||"");
    if(!validApplicationDate(date)){toast("Renseignez une date d’entretien valide");return}
    const records=rawApps(),item=records.find(entry=>entry.id===form.dataset.id);
    if(!item)return;
    item.interviews=Array.isArray(item.interviews)?item.interviews:[];
    const interview=form.dataset.interviewId?item.interviews.find(entry=>entry.id===form.dataset.interviewId):null;
    const values={date,time:String(data.get("time")||""),people:String(data.get("people")||"").trim(),note:String(data.get("note")||"").trim()};
    if(interview)Object.assign(interview,values);
    else item.interviews.push({id:slug(),...values});
    item.events.unshift({type:interview?"INTERVIEW_UPDATED":"INTERVIEW_ADDED",date:new Date().toISOString()});
    save(records);
    pipeline();
    openInterviewPanel(item.id,interview?.id||"new");
    toast(interview?"Entretien mis à jour":"Entretien ajouté");
  }));
  document.querySelectorAll(".interview-delete").forEach(button=>button.addEventListener("click",()=>{
    if(!confirm("Supprimer cet entretien ?"))return;
    const records=rawApps(),item=records.find(entry=>entry.id===button.dataset.id);
    if(!item||!Array.isArray(item.interviews))return;
    item.interviews=item.interviews.filter(entry=>entry.id!==button.dataset.interviewId);
    item.events.unshift({type:"INTERVIEW_REMOVED",date:new Date().toISOString()});
    save(records);
    pipeline();
    openInterviewPanel(item.id);
    toast("Entretien supprimé");
  }));
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
    if(url&&!/^https?:\/\//i.test(url)){toast("Utilisez un lien http ou https");return}
    if(url&&apps().some(item=>item.url===url)){toast("Cette offre figure déjà dans le suivi");return}
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
    layout(item.title,item.company,`<section class="panel tracking-detail"><p class="eyebrow">Dossier de suivi</p><h2>${esc(item.title)}</h2><p><strong>${esc(item.company)}</strong>${item.url?` · <a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Voir l’offre d’origine</a>`:""}</p><p>Ce dossier a été ajouté au suivi sans analyse automatique : aucun score ni CV personnalisé n’a été généré.</p><div class="tracking-logo-editor">${logo?`<img src="${esc(logo)}" alt="Logo de ${esc(item.company)}">`:`<span class="company-monogram" aria-hidden="true">${esc(item.company.slice(0,2).toUpperCase())}</span>`}<label>Logo de l’entreprise<input id="tracking-logo" type="file" accept="image/png,image/jpeg,image/webp"><small>Ajoutez ou remplacez le logo que vous avez fourni. La modification se synchronise sur vos appareils.</small></label></div><label>Statut<select id="status">${STATUSES.map(status=>`<option value="${status}" ${item.status===status?"selected":""}>${esc(statusLabels[status])}</option>`).join("")}</select></label><label>Précision factuelle<textarea id="tracking-note" rows="4">${esc(item.trackingNote||"")}</textarea></label><p class="muted">Les modifications sont enregistrées automatiquement.</p><button class="button danger" id="remove">Supprimer ce dossier</button></section>`,`<a class="button secondary" href="#pipeline">Retour au suivi</a>`);
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
