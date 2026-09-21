(() => {
const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const nl2br=s=>esc(s||'').replace(/\n/g,'<br>');
const safeUrl=u=>{try{const x=new URL(u);return ['http:','https:'].includes(x.protocol)?x.href:''}catch(e){return ''}};
const qs=new URLSearchParams(location.search);

function assetHtml(x){
 const a=x.assets||{}, blocks=[];
 if(a.prompt && (a.prompt.title||a.prompt.body)) blocks.push(`<div class="published-block"><b>PROMPT${a.prompt.title?' · '+esc(a.prompt.title):''}</b>${a.prompt.body?`<div class="published-text">${nl2br(a.prompt.body)}</div>`:''}</div>`);
 if(a.template && safeUrl(a.template.url)) blocks.push(`<a class="published-link" target="_blank" rel="noopener" href="${safeUrl(a.template.url)}">${esc(a.template.title||'템플릿 / 파일 열기')} →</a>`);
 if(a.app && safeUrl(a.app.url)) blocks.push(`<a class="published-link" target="_blank" rel="noopener" href="${safeUrl(a.app.url)}">${esc(a.app.title||'앱 열기')} →</a>`);
 return blocks.length?blocks.join(''):'PROMPT / TEMPLATE / APP';
}
function linksHtml(x){
 const links=(x.links||[]).filter(l=>safeUrl(l.url));
 if(!links.length)return 'CHECK / FILE / REFERENCE';
 return links.map(l=>`<a class="published-link" target="_blank" rel="noopener" href="${safeUrl(l.url)}"><span>${esc(l.type||'LINK')}</span>${esc(l.title||l.url)} →</a>`).join('');
}

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
   document.getElementById('learnAsset').innerHTML=l.learn?'<span class="published-badge">TEXT</span>':'TEXT / VIDEO / ARTICLE';
   document.getElementById('exampleText').innerHTML=nl2br(l.example||'사례·예제가 아직 입력되지 않았습니다.');
   document.getElementById('exampleAsset').innerHTML=l.example?'<span class="published-badge">EXAMPLE</span>':'EXAMPLE / IMAGE / LINK';
   document.getElementById('practiceText').textContent='프롬프트, 템플릿, 파일 또는 앱을 활용해 직접 실습합니다.';
   document.getElementById('practiceAsset').innerHTML=assetHtml(x);
   document.getElementById('reviewText').innerHTML=nl2br(l.check||'Tutor Check가 아직 입력되지 않았습니다.');
   document.getElementById('reviewAsset').innerHTML=linksHtml(x);
  }
  const same=D.contents.filter(c=>c.track===x.track), idx=same.findIndex(c=>c.id===x.id);
  const flowNext=x.published&&x.flow?.next?D.contents.find(c=>c.id===x.flow.next):null;
  const next=flowNext||same[idx+1];
  const nl=document.getElementById('nextLink'); if(next){nl.href=`lesson.html?id=${encodeURIComponent(next.id)}`;nl.textContent=`${next.id} ${next.title} →`}else{nl.href=`track.html?t=${encodeURIComponent(x.track)}`;nl.textContent='Track 전체 보기 →'}

 }
}
render();
})();
