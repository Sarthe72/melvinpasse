function rgbToHsl(rgb){
  const [r,g,b]=rgb.map(value=>value/255),max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
  let hue=0;
  if(delta){
    if(max===r)hue=60*(((g-b)/delta)%6);
    else if(max===g)hue=60*((b-r)/delta+2);
    else hue=60*((r-g)/delta+4);
  }
  if(hue<0)hue+=360;
  return{hue,saturation:delta?delta/(1-Math.abs(max+min-1)):0,lightness:(max+min)/2};
}

function cvHarmoniousColors(primary){
  const rgb=(primary.match(/\d+/g)||[44,93,73]).slice(0,3).map(Number);
  const {hue,saturation,lightness}=rgbToHsl(rgb);
  const h=Math.round(hue),s=Math.round(Math.max(42,Math.min(76,saturation*100)));
  return{
    accent:`hsl(${h} ${s}% ${Math.round(Math.max(40,Math.min(51,lightness*100)))}%)`,
    deep:`hsl(${h} ${Math.max(18,s-34)}% 17%)`,
    muted:`hsl(${h} 7% 39%)`,
    light:`hsl(${h} ${Math.min(38,s)}% 94%)`,
    paper:`hsl(${h} 18% 98%)`
  };
}

function cvPaletteFromLogo(dataUrl){
  return new Promise(resolve=>{
    const image=new Image();
    image.onload=()=>{
      const canvas=document.createElement("canvas");canvas.width=72;canvas.height=72;
      const context=canvas.getContext("2d",{willReadFrequently:true});context.clearRect(0,0,72,72);context.drawImage(image,0,0,72,72);
      const pixels=context.getImageData(0,0,72,72).data,buckets=new Map();
      for(let index=0;index<pixels.length;index+=16){
        if(pixels[index+3]<120)continue;
        const rgb=[pixels[index],pixels[index+1],pixels[index+2]],hsl=rgbToHsl(rgb);
        if(hsl.lightness>.94||hsl.lightness<.08)continue;
        const key=rgb.map(value=>Math.round(value/32)*32).join(",");
        const entry=buckets.get(key)||{rgb,count:0,saturation:hsl.saturation,lightness:hsl.lightness};entry.count+=1;buckets.set(key,entry);
      }
      const candidates=[...buckets.values()],chromatic=candidates.filter(entry=>entry.saturation>.2),source=chromatic.length?chromatic:candidates;
      source.sort((a,b)=>(b.count*(.45+b.saturation)*(1-Math.abs(b.lightness-.48)))-(a.count*(.45+a.saturation)*(1-Math.abs(a.lightness-.48))));
      resolve(cvHarmoniousColors(`rgb(${(source[0]?.rgb||[44,93,73]).join(",")})`));
    };
    image.onerror=()=>resolve(cvHarmoniousColors("rgb(44,93,73)"));image.src=dataUrl;
  });
}

function cvFact(main,fragment){return main.facts.find(value=>norm(value).includes(norm(fragment)))}
function cvPeriod(value){
  if(!value)return"";
  const [year,month]=value.split("-"),names=["","Janv.","Févr.","Mars","Avr.","Mai","Juin","Juil.","Août","Sept.","Oct.","Nov.","Déc."];
  return month?`${names[Number(month)]} ${year}`:year;
}

cv=async function(id){
  const item=getItem(id);if(!item)return dashboard();
  const scheme=await cvPaletteFromLogo(item.logo),skills=ranked(profile.skills,item.offer).slice(0,6),main=profile.experience[0];
  const groups=[
    {title:"Pilotage et performance",facts:[cvFact(main,"pilotage global"),cvFact(main,"indicateurs clés"),cvFact(main,"budget prévisionnel"),cvFact(main,"présence terrain")]},
    {title:"Management et qualité de service",facts:[cvFact(main,"management pluridisciplinaire"),cvFact(main,"recrutement, intégration"),cvFact(main,"animation terrain"),cvFact(main,"standards de qualité")]},
    {title:"Transformation de site",facts:[cvFact(main,"maître d'œuvre"),cvFact(main,"nouveau site"),cvFact(main,"coordination multi-intervenants"),cvFact(main,"zéro interruption")]},
    {title:"Résultats marquants",facts:[cvFact(main,"270 k€"),cvFact(main,"250 k€ à 36 M€"),"Organisation 2x8 mobilisant 40 collaborateurs sur trois semaines, reconduite en 2024 et 2025."]}
  ].map(group=>({...group,facts:ranked(group.facts.filter(Boolean),item.offer)}));
  const expertise=skills.map(skill=>({label:skill,detail:{
    "Pilotage de centre de profit":"Centre de profit, budget, indicateurs, reporting","Management opérationnel":"Organisation, recrutement, développement des équipes","Gestion de la performance":"Rendement, charges, taux de service","Budget et maîtrise des charges":"Budget, arbitrages, négociation fournisseurs","Amélioration continue":"Qualité, conformité, optimisation des organisations","Gestion de projet":"Projets complexes, coordination, conduite du changement","Structuration des process":"Méthodes de travail, outils et formalisation","Logistique et flux":"Plateforme, stocks, transporteurs, grands comptes","Gestion des stocks":"Stocks multi-références et coordination des flux","Relation clients grands comptes":"Amazon, Cdiscount, Fnac, La Redoute","Négociation fournisseurs":"Référencement, contrats et conditions tarifaires","Recrutement et développement des équipes":"Recrutement, intégration, compétences"
  }[skill]||skill}));
  const positioning=item.analysis.matches.slice(0,3).join("  |  ")||profile.identity.target_positioning.join("  |  ");
  const summary="Dirigeant opérationnel issu du terrain, avec 16 ans au sein de la même structure et une progression jusqu'à la direction de site. Expérience du pilotage d'un centre de profit, du management de jusqu'à 40 collaborateurs, de la qualité de service et de transformations complexes.";
  const engagement=["Parrain Initiative Sarthe - soutien à la création d'entreprise","Football - 13 ans secrétaire de club amateur"];
  const previousSummaries=["Bras droit du dirigeant : co-pilotage des opérations, déclinaison de la stratégie, arbitrage des priorités et décisions d'investissement, de recrutement et d'organisation.","Création et structuration d'un service complet : de 3 collaborateurs et 250 k€ de CA à 23 collaborateurs et 36 M€ de CA. Clients grands comptes, achats fournisseurs et management.","Point de départ d'une progression du terrain à la direction."];
  layout(item.title,"CV personnalisé · une page A4",`<div class="actions"><button class="button" id="print">Télécharger en PDF</button><a class="button secondary" href="#kit/${id}">Retour au kit</a></div><div class="cv-screen"><article class="cv-executive-page" style="--cv-accent:${scheme.accent};--cv-deep:${scheme.deep};--cv-muted:${scheme.muted};--cv-light:${scheme.light};--cv-paper:${scheme.paper}">
    <header class="exec-header"><img class="exec-photo" src="../app/static/assets/portrait-melvin-2026.jpg" alt="Portrait de Melvin Passe"><div class="exec-identity"><h1>MELVIN PASSE</h1><h2>${esc(item.title)}</h2><h3>CANDIDAT AU POSTE DE ${esc(item.title)}</h3><p>${esc(positioning)}</p></div><div class="exec-brand"><img class="exec-company-logo" src="${item.logo}" alt="Logo ${esc(item.company)}"><a href="https://${esc(profile.identity.cv_url)}" aria-label="Ouvrir le CV digital"><img class="exec-qr" src="../../template/assets/qr-code.png" alt="QR code du CV digital"><small>CV DIGITAL</small></a></div></header>
    <div class="exec-contact"><span>${esc(profile.identity.phone)} &nbsp; | &nbsp; ${esc(profile.identity.email)} &nbsp; | &nbsp; ${esc(profile.identity.location)} &nbsp; | &nbsp; Permis ${esc(profile.identity.driving_licenses.join(" & "))}</span><span>${esc(profile.identity.linkedin)} &nbsp; | &nbsp; ${esc(profile.identity.cv_url)}</span></div>
    <main class="exec-main"><section><h3 class="exec-section-title"><span>Profil exécutif</span></h3><p class="exec-summary">${esc(summary)} Une approche structurée, factuelle et proche des équipes.</p></section>
      <div class="exec-metrics"><div><b>36 M€</b><span>trajectoire de chiffre d'affaires</span></div><div><b>40</b><span>collaborateurs en période de pic</span></div><div><b>270 k€</b><span>économies annuelles négociées</span></div><div><b>-47 %</b><span>budget projet vs prévision</span></div></div>
      <section class="exec-experience"><h3 class="exec-section-title"><span>Expérience professionnelle</span></h3><div class="exec-role"><h4>${esc(main.company)} &nbsp;|&nbsp; ${esc(main.role)}</h4><b>${cvPeriod(main.start)} - ${cvPeriod(main.end)}</b></div><p class="exec-meta">${esc(main.location)} &nbsp;|&nbsp; ${esc(main.team)}</p><div class="exec-groups">${groups.map(group=>`<div><h5>${esc(group.title)}</h5><ul>${group.facts.map(fact=>`<li>${esc(fact)}</li>`).join("")}</ul></div>`).join("")}</div></section>
      <div class="exec-history">${profile.experience.slice(1).map((experience,index)=>`<section><div class="exec-role"><h4>${esc(experience.company)} &nbsp;|&nbsp; ${esc(experience.role)}</h4><b>${cvPeriod(experience.start)} - ${cvPeriod(experience.end)}</b></div><p class="exec-meta">${experience.contract?`${esc(experience.contract)} &nbsp;|&nbsp; `:""}${esc(experience.location||"")}</p><p>${esc(previousSummaries[index])}</p></section>`).join("")}</div>
      <section class="exec-expertise"><h3 class="exec-section-title"><span>Domaines d'expertise</span></h3><div>${expertise.map(value=>`<article><b>${esc(value.label)}</b><span>${esc(value.detail)}</span></article>`).join("")}</div></section>
      <div class="exec-footer-info"><p><b>FORMATION</b><span>${profile.education.map(value=>`${esc(value.label)} (${esc(value.year||value.period)})`).join(" &nbsp; | &nbsp; ")}</span></p><p><b>ENGAGEMENT</b><span>${engagement.map(esc).join(" &nbsp; | &nbsp; ")}</span></p></div></main>
    <footer class="exec-footer"><span>Melvin PASSE &nbsp;|&nbsp; Candidature ${esc(item.title)}</span><span>${esc(item.company)}</span></footer>
  </article></div>`);
  document.querySelector("#print").onclick=()=>window.print();
};
