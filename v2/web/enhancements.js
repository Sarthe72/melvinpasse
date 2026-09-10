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
    if(item.analysis?.compensationVersion!==1){
      item.analysis=analyze(item.offer);
      refreshed=true;
    }
  });
  if(refreshed)save(all);
  const requestedFilter=decodeURIComponent(location.hash.slice(1).split("/")[1]||"");
  const filter=STATUSES.includes(requestedFilter)?requestedFilter:"";
  const list=filter?all.filter(item=>item.status===filter):all;
  const rows=list.map(item=>`<tr>
    <td><div class="company-cell"><img src="${item.logo}" alt=""><strong>${esc(item.company)}</strong></div></td>
    <td>${esc(item.title)}</td>
    <td><span class="verdict-pill ${item.analysis.recommendation==="GO"?"go":item.analysis.recommendation==="NO GO"?"nogo":"review"}">${esc(item.analysis.recommendation)}</span></td>
    <td><b>${item.analysis.overall}/100</b></td>
    <td><select class="table-status" data-id="${esc(item.id)}" aria-label="Statut de ${esc(item.title)}">${STATUSES.map(status=>`<option value="${status}" ${status===item.status?"selected":""}>${esc(statusLabels[status])}</option>`).join("")}</select></td>
    <td>${new Date(item.events[0]?.date||item.createdAt).toLocaleDateString("fr-FR")}</td>
    <td><a class="row-link" href="#application/${item.id}">Ouvrir</a></td>
  </tr>`).join("");
  const emptyLabel=filter?`Aucune candidature avec le statut « ${statusLabels[filter]} ».`:"Aucune candidature suivie pour le moment.";
  const content=list.length?`<div class="tracking-table-wrap"><table class="tracking-table"><thead><tr><th>Entreprise</th><th>Poste</th><th>Analyse</th><th>Score</th><th>Statut</th><th>Dernière mise à jour</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`:`<div class="empty"><p>${esc(emptyLabel)}</p>${filter?`<a class="button secondary" href="#pipeline">Voir toutes les candidatures</a>`:`<a class="button" href="#dashboard">Analyser une annonce</a>`}</div>`;
  const filterNotice=filter?`<div class="active-filter"><span>Filtre : <b>${esc(statusLabels[filter])}</b></span><a href="#pipeline">Afficher tout</a></div>`:"";
  layout(filter?statusLabels[filter]:"Suivi des candidatures","Tableau de bord",`${filterNotice}<section class="panel tracking-panel">${content}</section>`,`<a class="button" href="#dashboard">Analyser une annonce</a>`);
  document.querySelectorAll(".table-status").forEach(select=>select.onchange=event=>{
    const records=apps(),item=records.find(entry=>entry.id===event.currentTarget.dataset.id);
    if(!item)return;
    item.status=event.currentTarget.value;
    item.events.unshift({type:"STATUS_CHANGED",date:new Date().toISOString()});
    save(records);
    toast(`Statut : ${statusLabels[item.status]}`);
  });
};
