(() => {
const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const nl2br=s=>esc(s||'').replace(/\n/g,'<br>');
const safeUrl=u=>{try{const x=new URL(u);return ['http:','https:'].includes(x.protocol)?x.href:''}catch(e){return ''}};
const qs=new URLSearchParams(location.search);

function legacyAssetHtml(x){
 const a=x.assets||{}, blocks=[];
 if(a.prompt && (a.prompt.title||a.prompt.body)) blocks.push(`<div class="published-block"><b>PROMPT${a.prompt.title?' · '+esc(a.prompt.title):''}</b>${a.prompt.body?`<div class="published-text">${nl2br(a.prompt.body)}</div>`:''}</div>`);
 if(a.template && safeUrl(a.template.url)) blocks.push(`<a class="published-link" target="_blank" rel="noopener" href="${safeUrl(a.template.url)}"><span>FILE</span>${esc(a.template.title||'템플릿 / 파일 열기')} →</a>`);
 if(a.app && safeUrl(a.app.url)) blocks.push(`<a class="published-link" target="_blank" rel="noopener" href="${safeUrl(a.app.url)}"><span>APP</span>${esc(a.app.title||'앱 열기')} →</a>`);
 return blocks.join('');
}
function linksHtml(x){
 const links=(x.links||[]).filter(l=>safeUrl(l.url));
 return links.map(l=>`<a class="published-link" target="_blank" rel="noopener" href="${safeUrl(l.url)}"><span>${esc(l.type||'LINK')}</span>${esc(l.title||l.url)} →</a>`).join('');
}
function normalizeBlock(b={},i=0){return {section:b.section||'learn',type:String(b.type||'TEXT').toUpperCase(),title:b.title||'',body:b.body||'',url:b.url||'',caption:b.caption||'',order:Number(b.order)||i+1}}
function checklistHtml(body){const items=String(body||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);return items.length?`<ul class="flex-checklist">${items.map(x=>`<li>${esc(x.replace(/^[-•□☐]\s*/,''))}</li>`).join('')}</ul>`:''}
function tableHtml(body){
 const rows=String(body||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>line.includes('|')?line.split('|'):line.split('\t')).map(r=>r.map(x=>x.trim()).filter((x,i,a)=>!(i===0&&x==='')&&!(i===a.length-1&&x===''))).filter(r=>r.length);
 if(!rows.length)return '';
 const max=Math.max(...rows.map(r=>r.length));
 const normalized=rows.map(r=>[...r,...Array(max-r.length).fill('')]);
 const head=normalized[0], bodyRows=normalized.slice(1);
 return `<div class="flex-table-wrap"><table class="flex-table"><thead><tr>${head.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead>${bodyRows.length?`<tbody>${bodyRows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>`:''}</table></div>`;
}
function youtubeEmbed(url){
 try{
  const u=new URL(url),host=u.hostname.replace(/^www\./,'');let id='';
  if(host==='youtu.be')id=u.pathname.split('/').filter(Boolean)[0]||'';
  else if(host==='youtube.com'||host==='m.youtube.com')id=u.searchParams.get('v')||((u.pathname.startsWith('/shorts/')||u.pathname.startsWith('/embed/'))?u.pathname.split('/')[2]:'');
  if(!id||!/^[A-Za-z0-9_-]{6,}$/.test(id))return '';
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;
 }catch(e){return ''}
}
function blockHtml(raw){
 const b=normalizeBlock(raw),type=b.type,title=esc(b.title),caption=esc(b.caption),url=safeUrl(b.url),body=String(b.body||'').trim();
 const heading=title?`<h3>${title}</h3>`:'';
 if(type==='TEXT'){if(!body)return '';return `<article class="flex-block flex-text"><div class="flex-kind">TEXT</div>${heading}<div class="flex-body">${nl2br(body)}</div></article>`}
 if(type==='NOTICE'){if(!body)return '';return `<aside class="flex-block flex-notice"><div class="flex-kind">NOTICE</div>${heading}<div class="flex-body">${nl2br(body)}</div></aside>`}
 if(type==='CHECKLIST'){const list=checklistHtml(body);if(!list)return '';return `<article class="flex-block flex-check"><div class="flex-kind">CHECKLIST</div>${heading}${list}</article>`}
 if(type==='TABLE'){const table=tableHtml(body);if(!table)return '';return `<article class="flex-block flex-table-block"><div class="flex-kind">TABLE</div>${heading}${table}</article>`}
 if(type==='PROMPT'){if(!body)return '';return `<article class="flex-block flex-prompt"><div class="flex-kind">PROMPT</div>${heading}<pre>${esc(body)}</pre></article>`}
 if(type==='IMAGE'){if(!url)return '';return `<figure class="flex-block flex-image"><div class="flex-kind">IMAGE</div>${heading}<img loading="lazy" src="${url}" alt="${title||caption||'학습 이미지'}">${caption?`<figcaption>${caption}</figcaption>`:''}</figure>`}
 if(type==='VIDEO'){
  if(!url)return '';
  const embed=youtubeEmbed(url);
  if(embed)return `<article class="flex-block flex-video"><div class="flex-kind">VIDEO</div>${heading}<div class="video-frame"><iframe src="${embed}" title="${title||'학습 영상'}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>${caption?`<p class="flex-caption">${caption}</p>`:''}</article>`;
  if(/\.(mp4|webm|ogg)(\?|$)/i.test(url))return `<article class="flex-block flex-video"><div class="flex-kind">VIDEO</div>${heading}<video controls preload="metadata" src="${url}"></video>${caption?`<p class="flex-caption">${caption}</p>`:''}</article>`;
  return `<a class="published-link flex-link" target="_blank" rel="noopener" href="${url}"><span>VIDEO</span>${title||'영상 열기'} →${caption?`<small>${caption}</small>`:''}</a>`;
 }
 if(['LINK','FILE','APP'].includes(type)){if(!url)return '';return `<a class="published-link flex-link" target="_blank" rel="noopener" href="${url}"><span>${type}</span>${title||esc(b.url)} →${caption?`<small>${caption}</small>`:''}</a>`}
 return '';
}
function sectionBlocks(x,section){
 const blocks=Array.isArray(x.assets?.blocks)?x.assets.blocks:[];
 return blocks.map(normalizeBlock).filter(b=>b.section===section).sort((a,b)=>a.order-b.order).map(blockHtml).filter(Boolean).join('');
}
function showResources(id,html){const el=document.getElementById(id);if(!el)return;el.innerHTML=html||'';el.hidden=!html;}

async function render(){
 const D=window.HUB_READY?await window.HUB_READY:window.HUB_DATA;
 if(!D)return;
 const total=D.contents.length;
 const publishedCount=D.contents.filter(x=>x.published).length;
 const hs=document.getElementById('hubStats');if(hs)hs.textContent=`${D.tracks.length} LEARNING TRACKS · ${total} CONTENTS`;
 const ls=document.getElementById('libraryStats');if(ls)ls.textContent=`${total} CORE CONTENTS${publishedCount?` · ${publishedCount} PUBLISHED`:''}`;

 const trackGrid=document.getElementById('trackGrid');
 if(trackGrid) trackGrid.innerHTML=D.tracks.map(t=>`<a class="track-card" href="track.html?t=${encodeURIComponent(t.num)}"><b>${esc(t.num)}</b><h3>${esc(t.name)}</h3><p>${esc(t.desc||'')}</p><small>${t.count} CONTENTS →</small></a>`).join('');

 const tnum=qs.get('t');
 if(document.getElementById('contentList')){
  const t=D.tracks.find(x=>x.num===tnum)||D.tracks[0]; if(!t)return;
  document.title=t.name+' | Learning Hub';
  document.getElementById('trackNo').textContent=`TRACK ${t.num}`;
  document.getElementById('trackName').textContent=t.name;
  document.getElementById('trackDesc').textContent=t.desc||'';
  document.getElementById('trackCount').textContent=`${t.count} CONTENTS`;
  const items=D.contents.filter(x=>x.track===t.num);
  document.getElementById('contentList').innerHTML=items.map(x=>`<a class="content-row ${x.status}" href="lesson.html?id=${encodeURIComponent(x.id)}"><span class="cid">${esc(x.id)}</span><div><h3>${esc(x.title)}</h3><p>${esc(x.summary||'')}</p></div><span class="state">${x.published?'PUBLISHED →':x.status==='open'?'PROTOTYPE OPEN →':'FRAMEWORK →'}</span></a>`).join('')||'<p>공개된 콘텐츠가 아직 없습니다.</p>';
 }

 const lib=document.getElementById('libraryList');
 if(lib){
  const filters=document.getElementById('filters'), input=document.getElementById('search');
  filters.innerHTML=`<button class="active" data-t="all">전체 ${total}</button>`+D.tracks.map(t=>`<button data-t="${esc(t.num)}">${esc(t.num)} ${esc(t.name)}</button>`).join('');
  let filter='all';
  const draw=()=>{const q=input.value.trim().toLowerCase();const arr=D.contents.filter(x=>(filter==='all'||x.track===filter)&&(!q||(x.title+x.trackName+(x.summary||'')).toLowerCase().includes(q)));lib.innerHTML=arr.map(x=>`<a class="library-item ${x.status}" href="lesson.html?id=${encodeURIComponent(x.id)}"><small>${esc(x.id)} · ${esc(x.trackName)}</small><h3>${esc(x.title)}</h3><p>${esc(x.published?(x.summary||'공개 콘텐츠입니다.'):x.status==='open'?'Prototype 콘텐츠가 연결되어 있습니다.':'Framework가 준비되어 있으며 내용은 이후 보완됩니다.')}</p></a>`).join('')||'<p>검색 결과가 없습니다.</p>'};
  filters.onclick=e=>{if(e.target.tagName!=='BUTTON')return;[...filters.children].forEach(b=>b.classList.remove('active'));e.target.classList.add('active');filter=e.target.dataset.t;draw()};
  input.oninput=draw;draw();
 }

 if(document.getElementById('lessonTitle')){
  const id=qs.get('id')||'03-01', x=D.contents.find(c=>c.id===id)||D.contents[0]; if(!x)return;
  document.title=x.title+' | Learning Hub';
  document.getElementById('lessonMeta').textContent=`TRACK ${x.track} · ${x.trackName} / ${x.id}${x.published?' · PUBLISHED':''}`;
  document.getElementById('lessonTitle').textContent=x.title;
  document.getElementById('lessonSummary').textContent=x.published?(x.summary||'공개된 학습콘텐츠입니다.'):x.status==='open'?'Prototype에서 검증한 학습 구조를 공통 Framework로 사용합니다.':x.summary;
  document.getElementById('backTrack').href=`track.html?t=${encodeURIComponent(x.track)}`;
  const note=document.getElementById('lessonNote'); if(note&&x.published){note.querySelector('strong').textContent='CMS PUBLISHED';note.querySelector('p').textContent='이 콘텐츠는 Learning Hub CMS에서 게시된 최신 내용을 표시합니다.'}
  if(x.published){
   const l=x.learning||{};
   document.getElementById('learnText').innerHTML=nl2br(l.learn||'핵심 설명이 아직 입력되지 않았습니다.');
   document.getElementById('exampleText').innerHTML=nl2br(l.example||'사례·예제가 아직 입력되지 않았습니다.');
   document.getElementById('practiceText').textContent='프롬프트, 템플릿, 파일 또는 앱을 활용해 직접 실습합니다.';
   document.getElementById('reviewText').innerHTML=nl2br(l.check||'Tutor Check가 아직 입력되지 않았습니다.');
   showResources('learnAsset',sectionBlocks(x,'learn'));
   showResources('exampleAsset',sectionBlocks(x,'understand'));
   showResources('practiceAsset',[legacyAssetHtml(x),sectionBlocks(x,'practice')].filter(Boolean).join(''));
   showResources('reviewAsset',[linksHtml(x),sectionBlocks(x,'review')].filter(Boolean).join(''));
  } else {
   showResources('learnAsset','');showResources('exampleAsset','');showResources('practiceAsset','');showResources('reviewAsset','');
  }
  const same=D.contents.filter(c=>c.track===x.track), idx=same.findIndex(c=>c.id===x.id);
  const flowNext=x.published&&x.flow?.next?D.contents.find(c=>c.id===x.flow.next):null;
  const next=flowNext||same[idx+1];
  const nl=document.getElementById('nextLink'); if(next){nl.href=`lesson.html?id=${encodeURIComponent(next.id)}`;nl.textContent=`${next.id} ${next.title} →`}else{nl.href=`track.html?t=${encodeURIComponent(x.track)}`;nl.textContent='Track 전체 보기 →'}
 }
}
render();
})();
