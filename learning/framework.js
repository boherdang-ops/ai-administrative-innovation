(()=>{const D=window.HUB_DATA;if(!D)return;
const qs=new URLSearchParams(location.search);
const trackGrid=document.getElementById('trackGrid');
if(trackGrid) trackGrid.innerHTML=D.tracks.map(t=>`<a class="track-card" href="track.html?t=${t.num}"><b>${t.num}</b><h3>${t.name}</h3><p>${t.desc}</p><small>${t.count} CONTENTS →</small></a>`).join('');

const tnum=qs.get('t');
if(document.getElementById('contentList')){
 const t=D.tracks.find(x=>x.num===tnum)||D.tracks[2];
 document.title=t.name+' | Learning Hub';
 document.getElementById('trackNo').textContent=`TRACK ${t.num}`;
 document.getElementById('trackName').textContent=t.name;
 document.getElementById('trackDesc').textContent=t.desc;
 document.getElementById('trackCount').textContent=`${t.count} CONTENTS`;
 const items=D.contents.filter(x=>x.track===t.num);
 document.getElementById('contentList').innerHTML=items.map(x=>`<a class="content-row ${x.status}" href="lesson.html?id=${x.id}"><span class="cid">${x.id}</span><div><h3>${x.title}</h3><p>${x.summary}</p></div><span class="state">${x.status==='open'?'PROTOTYPE OPEN →':'FRAMEWORK →'}</span></a>`).join('');
}

const lib=document.getElementById('libraryList');
if(lib){
 const filters=document.getElementById('filters'), input=document.getElementById('search');
 filters.innerHTML=`<button class="active" data-t="all">전체 24</button>`+D.tracks.map(t=>`<button data-t="${t.num}">${t.num} ${t.name}</button>`).join('');
 let filter='all';
 const render=()=>{const q=input.value.trim().toLowerCase();const arr=D.contents.filter(x=>(filter==='all'||x.track===filter)&&(!q||(x.title+x.trackName).toLowerCase().includes(q)));lib.innerHTML=arr.map(x=>`<a class="library-item ${x.status}" href="lesson.html?id=${x.id}"><small>${x.id} · ${x.trackName}</small><h3>${x.title}</h3><p>${x.status==='open'?'Prototype 콘텐츠가 연결되어 있습니다.':'Framework가 준비되어 있으며 내용은 이후 보완됩니다.'}</p></a>`).join('')||'<p>검색 결과가 없습니다.</p>'};
 filters.onclick=e=>{if(e.target.tagName!=='BUTTON')return;[...filters.children].forEach(b=>b.classList.remove('active'));e.target.classList.add('active');filter=e.target.dataset.t;render()};
 input.oninput=render;render();
}

if(document.getElementById('lessonTitle')){
 const id=qs.get('id')||'03-01', x=D.contents.find(c=>c.id===id)||D.contents.find(c=>c.id==='03-01');
 document.title=x.title+' | Learning Hub';
 document.getElementById('lessonMeta').textContent=`TRACK ${x.track} · ${x.trackName} / ${x.id}`;
 document.getElementById('lessonTitle').textContent=x.title;
 document.getElementById('lessonSummary').textContent=x.status==='open'?'Prototype에서 검증한 학습 구조를 공통 Framework로 사용합니다.':x.summary;
 document.getElementById('backTrack').href=`track.html?t=${x.track}`;
 const same=D.contents.filter(c=>c.track===x.track), idx=same.findIndex(c=>c.id===x.id), next=same[idx+1];
 const nl=document.getElementById('nextLink'); if(next){nl.href=`lesson.html?id=${next.id}`;nl.textContent=`${next.id} ${next.title} →`}else{nl.href=`track.html?t=${x.track}`;nl.textContent='Track 전체 보기 →'}
 const bar=document.getElementById('bar'); const update=()=>{const h=document.documentElement,max=h.scrollHeight-h.clientHeight;bar.style.width=(max?Math.min(100,h.scrollTop/max*100):0)+'%'};addEventListener('scroll',update,{passive:true});update();
}
})();