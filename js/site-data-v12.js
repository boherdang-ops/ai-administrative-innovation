(()=>{const KEY='psV12CMS',DRAFT='psV12CMSDraft',PUB='psV12CMSPublished';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const get=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
async function load(){const preview=new URLSearchParams(location.search).has('preview');let d=preview?(get(DRAFT)||get(KEY)):null;if(!preview&&window.V12_CLOUD?.ready()){try{const x=await V12_CLOUD.getPublished();d=x?.content||x||null}catch(e){console.warn('Cloud read failed',e)}}if(!d)d=get(PUB)||get(KEY);if(!d){try{d=await (await fetch('data/site-default.json')).json()}catch(e){return}}render(d)}
function render(d){
 const q=s=>document.querySelector(s); const qa=s=>[...document.querySelectorAll(s)];
 if(d.profile){q('.kicker').textContent=d.profile.kicker||d.profile.name;q('#about h1').innerHTML=esc(d.profile.headline).replace(/\n/g,'<br>');q('#about .lead').textContent=d.profile.lead;q('#about .career').innerHTML=(d.profile.career||[]).map(esc).join('<br>');const fig=q('#profile-photo');if(d.profile.portrait)fig.innerHTML=`<img src="${esc(d.profile.portrait)}" alt="${esc(d.profile.name)} 프로필 사진">`;const logo=q('.brand-logo');if(logo&&d.profile.logo)logo.src=d.profile.logo;}
 if(d.problems){q('.problems').innerHTML=d.problems.map((x,i)=>`<article><b>${String(i+1).padStart(2,'0')}</b><h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p></article>`).join('')}
 if(d.problemBridge){const a=d.problemBridge.split(',');q('.bridge').innerHTML=esc(a[0]+(a.length>1?',':''))+'<br><strong>'+esc(a.slice(1).join(',').trim())+'</strong>'}
 if(d.records){q('.timeline').innerHTML=d.records.map(y=>`<div class="year">${esc(y.year)}<br><small>${esc(y.theme)}</small></div><div>${(y.items||[]).map(i=>`<p>${esc(i)}</p>`).join('')}</div>`).join('');q('.count strong').textContent=d.recordCount||''}
 if(d.method){q('.steps').innerHTML=d.method.map((x,i)=>`<div>${String(i+1).padStart(2,'0')}<h3>${esc(x)}</h3></div>`).join('')}
 if(d.kaim){q('.kaim h3').textContent=d.kaim.title;q('.kaim>p:not(.eyebrow)').textContent=d.kaim.desc}
 if(d.courses){q('.course-list').innerHTML=d.courses.map((x,i)=>`<div><span>${String(i+1).padStart(2,'0')}</span><b>${esc(x.name)}</b><em>${esc(x.target)}</em><small>${esc(x.hours)}</small></div>`).join('')}
 if(d.works){q('.works').innerHTML=d.works.map((x,i)=>`<article>${x.image?`<img class="work-image" src="${esc(x.image)}" alt="${esc(x.title)}">`:''}<b>${String(i+1).padStart(2,'0')}</b><h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p></article>`).join('')}
 if(d.book){const m=q('.portfolio-meta:nth-child(3) strong');if(m)m.textContent='「'+d.book.title.replace(/[「」]/g,'')+'」'}
 if(d.archive){q('.archive-items').innerHTML=d.archive.map(x=>`<span>${esc(x)}</span>`).join('')}
 if(d.contact)q('.contact').textContent=`${d.contact.email||''} · ${d.contact.phone||''}`;
}
load();})();