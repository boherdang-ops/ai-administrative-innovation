(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const safe=v=>{try{return ['http:','https:'].includes(new URL(v,location.href).protocol)?v:''}catch{return ''}};
function preview(a){const image=safe(a.image)||(/^data:image\//.test(a.image||'')?a.image:'');return image?`<img src="${esc(image)}" alt="${esc(a.title)}" loading="lazy">`:`<img src="assets/previews/${esc(a.id)}.png" alt="${esc(a.title)} 실제 화면" loading="lazy">`;}
function render(d){
const set=(id,v)=>document.getElementById(id).innerHTML=v;
const registered=d.assets.filter(a=>a.public!==false&&V12_STORY_REGISTERED(a));
set('identity-facts',`<div class="facts"><div><strong>2024–2026</strong><span>교육·워크숍 기록</span></div><div><strong>${esc(d.recordCount)}</strong><span>교육·워크숍 회차</span></div><div><strong>${registered.length}</strong><span>등록 지식자산</span></div><div><strong>1</strong><span>개인 저서</span></div></div>`);
const first=(d.records||[]).find(r=>r.year==='2024');set('early-records',first?`<div class="year">${esc(first.year)}</div><div>${first.items.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:'<p>CMS에 2024년 실적을 등록해 주세요.</p>');
set('evolution-records',(d.records||[]).map(r=>`<article><b>${esc(r.year)}</b><h3>${esc(r.theme)}</h3><p>${r.items.map(esc).join('<br>')}</p></article>`).join(''));
set('build-showcase',['BOOK01','APP05','TOOL01'].map(id=>d.assets.find(a=>a.id===id&&a.public!==false)).filter(Boolean).map(a=>`<article class="showcase">${preview(a)}<div><p class="eyebrow">${esc(a.category)}</p><h3>${esc(a.title)}</h3><p>${esc(a.desc)}</p>${safe(a.url)?`<a class="asset-link" href="${esc(a.url)}" target="_blank" rel="noopener">실제 자료 열기 ↗</a>`:''}</div></article>`).join(''));
set('book-evidence',`<article class="book-evidence"><b>1 BOOK / 개인 저서</b><h3>${esc(d.book?.title||'개인 저서 1권')}</h3>${d.book?.image?`<img src="${esc(d.book.image)}" alt="저서 표지">`:''}<p>${esc(d.book?.publisher ?? PS_STORY_DEFAULTS.book.publisher)} · ${esc(d.book?.publicationDate ?? PS_STORY_DEFAULTS.book.publicationDate)}<br>ISBN ${esc(d.book?.isbn ?? PS_STORY_DEFAULTS.book.isbn)}</p></article>`);
const channels=d.story?.channels||PS_STORY_DEFAULTS.story.channels;
set('share-channels','<div class="channel-grid">'+channels.map(x=>`<article><b>${esc(x.name)}</b>${safe(x.url)?`<a class="asset-link" href="${esc(x.url)}" target="_blank" rel="noopener">콘텐츠 보기 ↗</a>`:'<p>채널 주소 준비 중</p>'}</article>`).join('')+'</div>');
// Existing CMS archive controls the public Share heading and descriptions through its original fields.
document.querySelector('#thinking .head h2').textContent=d.story?.shareTitle||'글과 영상으로 경험을 나눕니다.';
set('hub-showcase',`<a class="hub-visual" href="learning/"><img src="assets/previews/HUB.png" alt="Learning Hub 실제 학습 화면" loading="lazy"></a><div class="hub-links"><a class="asset-link" href="learning/">Learning Hub 시작하기 ↗</a><a class="asset-link" href="learning/library.html">자료 라이브러리 ↗</a><a class="asset-link" href="courses/">교육과정 보기 ↗</a></div><p>${esc(d.story?.hubDesc||'학습 트랙, 실습 템플릿, 워크북을 연결합니다. 교육 이후에도 실제 업무에 적용할 수 있는 자료를 제공합니다.')}</p>`);
// Move the existing registered-assets view without changing its rendering or data.
document.getElementById('book-evidence').before(document.getElementById('intellectual-assets'));
}
function V12_STORY_REGISTERED(a){return a.registered===true&&a.registrationNumber&&a.registrationDate&&(a.kind!=='app'||['APP05','APP06'].includes(a.id));}
const original=V12_ASSETS.render;V12_ASSETS.render=d=>{original(d);render(d)};
})();
