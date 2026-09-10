function cvHarmoniousColors(primary){
  const rgb=(primary.match(/\d+/g)||[122,158,135]).slice(0,3).map(Number);
  const [r,g,b]=rgb.map(value=>value/255),max=Math.max(r,g,b),min=Math.min(r,g,b);
  let hue=0,saturation=0;
  const lightness=(max+min)/2,delta=max-min;
  if(delta){
    saturation=delta/(1-Math.abs(2*lightness-1));
    if(max===r)hue=60*(((g-b)/delta)%6);
    else if(max===g)hue=60*((b-r)/delta+2);
    else hue=60*((r-g)/delta+4);
  }
  if(hue<0)hue+=360;
  const chroma=Math.max(38,Math.min(78,Math.round(saturation*100)));
  return{
    accent:`hsl(${Math.round(hue)} ${chroma}% ${Math.max(38,Math.min(52,Math.round(lightness*100)))}%)`,
    deep:`hsl(${Math.round(hue)} ${Math.max(30,chroma-18)}% 22%)`,
    side:`hsl(${Math.round(hue)} ${Math.max(28,chroma-24)}% 30%)`,
    light:`hsl(${Math.round(hue)} 38% 93%)`
  };
}

cv=async function(id){
  const item=getItem(id);
  if(!item)return dashboard();
  const colors=await palette(item.logo);
  const scheme=cvHarmoniousColors(colors.primary);
  const skills=ranked(profile.skills,item.offer).slice(0,8);
  const main=profile.experience[0];
  const groups=[
    {title:"Pilotage opérationnel & performance",facts:main.facts.slice(0,4)},
    {title:"Management & développement des équipes",facts:[`Management pluridisciplinaire : ${main.team}`,main.facts[6]]},
    {title:"Process, qualité & amélioration continue",facts:main.facts.slice(4,6)},
    {title:"Logistique, flux & coordination",facts:main.facts.slice(7,10)},
    {title:"Résultats économiques",facts:main.facts.slice(10,12)}
  ];
  const proofs=item.analysis.evidence.slice(0,2);
  const otherExperiences=profile.experience.slice(1);
  const subtitle=item.analysis.matches.slice(0,2).join(" & ")||profile.signature;
  layout(item.title,"CV personnalisé · format de référence",`<div class="actions"><button class="button" id="print">Télécharger en PDF</button><a class="button secondary" href="#kit/${id}">Retour au kit</a></div><div class="cv-screen"><article class="cv-spie-page" style="--company-accent:${scheme.accent};--company-deep:${scheme.deep};--company-side:${scheme.side};--company-light:${scheme.light}">
    <header class="spie-head">
      <img class="spie-photo" src="../app/static/assets/portrait-melvin-2026.jpg" alt="Portrait de Melvin Passe">
      <div class="spie-name"><h1>MELVIN <span>PASSE</span></h1><h2>${esc(item.title)}</h2><p>${esc(subtitle)}</p></div>
      <img class="spie-company-logo" src="${item.logo}" alt="Logo ${esc(item.company)}">
      <div class="spie-contact"><b>${esc(profile.identity.email)}</b><b>${esc(profile.identity.phone)}</b><span>Permis ${esc(profile.identity.driving_licenses.join(" & "))}</span><span>${esc(profile.identity.linkedin)}</span></div>
    </header>
    <aside class="spie-side">
      <svg class="spie-side-bg" aria-hidden="true" viewBox="0 0 47 258" preserveAspectRatio="none"><rect width="47" height="258"></rect></svg>
      <section><h3>Compétences</h3>${skills.map(value=>`<span class="spie-pill">${esc(value)}</span>`).join("")}</section>
      <section><h3>Savoir-être</h3>${profile.soft_skills.map(value=>`<span class="spie-pill">${esc(value)}</span>`).join("")}</section>
      <section><h3>Digital</h3>${profile.digital.map(value=>`<span class="spie-pill">${esc(value)}</span>`).join("")}</section>
      <section><h3>Profil</h3><ul><li>${esc(profile.identity.location)}</li><li>Permis ${esc(profile.identity.driving_licenses.join(" & "))}</li></ul></section>
      <section><h3>Formation</h3>${profile.education.map(value=>`<div class="spie-education"><b>${esc(value.year||value.period)}</b><strong>${esc(value.label)}</strong></div>`).join("")}</section>
      <section><h3>Engagement local</h3><ul>${profile.engagement.map(value=>`<li>${esc(value)}</li>`).join("")}</ul></section>
    </aside>
    <main class="spie-main">
      <section class="spie-profile"><h3>Profil</h3><p>${esc(profile.summary)}</p><p>${esc(profile.signature)}</p></section>
      <section><h3>Expériences professionnelles</h3><div class="spie-role"><h4>${esc(main.role)}</h4><span>${esc(main.start)} → ${esc(main.end)}</span></div><b class="spie-meta">${esc(main.company)} · ${esc(main.location)} · ${esc(main.team)}</b><div class="spie-groups">${groups.map(group=>`<div><h5>${esc(group.title)}</h5><ul>${group.facts.map(fact=>`<li>${esc(fact)}</li>`).join("")}</ul></div>`).join("")}</div></section>
      <div class="spie-proofs">${proofs.map(proof=>`<article><b>${esc(proof.title)}</b><p>${proof.facts.map(esc).join(" · ")}</p></article>`).join("")}</div>
      <div class="spie-tags">${skills.map(value=>`<span>${esc(value)}</span>`).join("")}</div>
      ${otherExperiences.map(experience=>`<section class="spie-past"><div class="spie-role"><h4>${esc(experience.role)}</h4><span>${esc(experience.start)} → ${esc(experience.end)}</span></div><b class="spie-meta">${esc(experience.company)}${experience.location?` · ${esc(experience.location)}`:""}</b><ul>${experience.facts.map(fact=>`<li>${esc(fact)}</li>`).join("")}</ul></section>`).join("")}
    </main>
  </article></div>`);
  document.querySelector("#print").onclick=()=>window.print();
};
