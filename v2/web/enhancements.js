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
  const rank={ENTRETIEN:0,OFFRE:1,RELANCE:2,CANDIDATE:3,A_CANDIDATER:4,A_ETUDIER:5,ACCEPTE:6,REFUSE:7,ABANDONNE:8};
  const list=(filter?all.filter(item=>item.status===filter):all).sort((a,b)=>(rank[a.status]??9)-(rank[b.status]??9)||(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0));
  const rows=list.map(item=>`<tr>
    <td data-label="Entreprise"><div class="company-cell">${item.logo?`<img src="${item.logo}" alt="">`:`<span class="company-monogram" aria-hidden="true">${esc(item.company.slice(0,2).toUpperCase())}</span>`}<strong>${esc(item.company)}</strong></div></td>
    <td data-label="Poste"><a class="tracking-title-link" href="#application/${item.id}">${esc(item.title)}</a></td>
    <td data-label="Analyse">${item.trackingOnly?"<span class=\"muted\">Non analysée</span>":`<span class="verdict-pill ${item.analysis.recommendation==="GO"?"go":item.analysis.recommendation==="NO GO"?"nogo":"review"}">${esc(item.analysis.recommendation)}</span>`}</td>
    <td data-label="Score">${item.trackingOnly?"—":`<b>${item.analysis.overall}/100</b>`}</td>
    <td data-label="Statut"><select class="table-status" data-id="${esc(item.id)}" aria-label="Statut de ${esc(item.title)}">${STATUSES.map(status=>`<option value="${status}" ${status===item.status?"selected":""}>${esc(tableStatusLabels[status])}</option>`).join("")}</select></td>
    <td data-label="Précision" class="tracking-note-cell">${esc(item.trackingNote||"—")}</td>
    <td data-label="Mise à jour" class="tracking-date-cell">${new Date(item.events[0]?.date||item.createdAt).toLocaleDateString("fr-FR")}</td>
  </tr>`).join("");
  const emptyLabel=filter?`Aucune candidature avec le statut « ${statusLabels[filter]} ».`:"Aucune candidature suivie pour le moment.";
  const content=list.length?`<div class="tracking-table-wrap"><table class="tracking-table"><thead><tr><th>Entreprise</th><th>Poste</th><th>Analyse</th><th>Score</th><th>Statut</th><th>Précision</th><th>Dernière mise à jour</th></tr></thead><tbody>${rows}</tbody></table></div>`:`<div class="empty"><p>${esc(emptyLabel)}</p>${filter?`<a class="button secondary" href="#pipeline">Voir toutes les candidatures</a>`:`<a class="button" href="#dashboard">Analyser une annonce</a>`}</div>`;
  const filterNotice=filter?`<div class="active-filter"><span>Filtre : <b>${esc(statusLabels[filter])}</b></span><a href="#pipeline">Afficher tout</a></div>`:"";
  const addForm=`<details class="panel tracking-add"><summary>Ajouter un dossier déjà traité</summary><p>Pour suivre une candidature antérieure sans créer une fausse analyse.</p><form id="tracking-add-form" class="form"><label>Entreprise<input name="company" required></label><label>Poste<input name="title" required></label><label class="full">Lien de l’offre<input name="url" type="url" required placeholder="https://…"></label><label>Statut<select name="status">${STATUSES.map(status=>`<option value="${status}">${esc(statusLabels[status])}</option>`).join("")}</select></label><label class="full">Précision factuelle<textarea name="trackingNote" rows="3" required placeholder="Ex. : envoyée sur Apec le 07/10/2026"></textarea></label><div class="full form-actions"><button class="button" type="submit">Ajouter au suivi</button></div></form></details>`;
  layout(filter?statusLabels[filter]:"Suivi des candidatures","Tableau de bord",`${filterNotice}<section class="panel tracking-panel">${content}</section>${filter?"":addForm}`,`<a class="button" href="#dashboard">Analyser une annonce</a>`);
  document.querySelectorAll(".table-status").forEach(select=>select.onchange=event=>{
    const records=apps(),item=records.find(entry=>entry.id===event.currentTarget.dataset.id);
    if(!item)return;
    item.status=event.currentTarget.value;
    item.events.unshift({type:"STATUS_CHANGED",date:new Date().toISOString()});
    save(records);
    toast(`Statut : ${statusLabels[item.status]}`);
  });
  document.querySelector("#tracking-add-form")?.addEventListener("submit",event=>{
    event.preventDefault();
    const form=new FormData(event.currentTarget),url=String(form.get("url")).trim();
    if(!/^https?:\/\//i.test(url)){toast("Utilisez un lien http ou https");return}
    if(apps().some(item=>item.url===url)){toast("Cette offre figure déjà dans le suivi");return}
    const date=new Date().toISOString();
    const item={id:slug(),company:String(form.get("company")).trim(),title:String(form.get("title")).trim(),url,offer:"",logo:"",status:String(form.get("status")),trackingOnly:true,trackingNote:String(form.get("trackingNote")).trim(),createdAt:date,events:[{type:"ADDED_TO_TRACKING",date}]};
    save([item,...rawApps()]);
    route();
    toast("Dossier ajouté au suivi");
  });
};

const renderAnalyzedApplication=application;
application=function(id){
  const item=getItem(id);
  if(!item?.trackingOnly){
    renderAnalyzedApplication(id);
  }else{
    layout(item.title,item.company,`<section class="panel tracking-detail"><p class="eyebrow">Dossier de suivi</p><h2>${esc(item.title)}</h2><p><strong>${esc(item.company)}</strong> · <a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Voir l’offre d’origine</a></p><p>Ce dossier a été ajouté au suivi sans analyse automatique : aucun score ni CV personnalisé n’a été généré.</p><label>Statut<select id="status">${STATUSES.map(status=>`<option value="${status}" ${item.status===status?"selected":""}>${esc(statusLabels[status])}</option>`).join("")}</select></label><label>Précision factuelle<textarea id="tracking-note" rows="4">${esc(item.trackingNote||"")}</textarea></label><p class="muted">Les modifications sont enregistrées automatiquement.</p><button class="button danger" id="remove">Supprimer ce dossier</button></section>`,`<a class="button secondary" href="#pipeline">Retour au suivi</a>`);
    document.querySelector("#status").onchange=event=>{const records=rawApps(),found=records.find(entry=>entry.id===id);found.status=event.target.value;found.events.unshift({type:"STATUS_CHANGED",date:new Date().toISOString()});save(records);toast(`Statut : ${statusLabels[found.status]}`)};
    document.querySelector("#tracking-note").onchange=event=>{const records=rawApps(),found=records.find(entry=>entry.id===id);found.trackingNote=event.target.value.trim();found.events.unshift({type:"NOTE_CHANGED",date:new Date().toISOString()});save(records);toast("Précision mise à jour")};
  }
  const remove=document.querySelector("#remove");
  if(remove)remove.onclick=()=>{if(!confirm("Supprimer ce dossier de tous vos appareils ?"))return;const records=rawApps(),found=records.find(entry=>entry.id===id);if(!found)return;found.deletedAt=new Date().toISOString();save(records);location.hash="pipeline"};
};
