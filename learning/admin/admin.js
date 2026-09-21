(()=>{const STORAGE='learningHubCmsV06';const deep=x=>JSON.parse(JSON.stringify(x));
function getSeed(){
  const raw=window.INITIAL_CMS_DATA;
  if(!raw) throw new Error('초기 CMS 데이터(cms-seed.js)를 찾을 수 없습니다.');
  const data=typeof raw==='string'?JSON.parse(raw):deep(raw);
  if(!data || !Array.isArray(data.tracks) || !Array.isArray(data.contents)) throw new Error('초기 CMS 데이터 형식이 올바르지 않습니다.');
  return data;
}
let db=null,selected=null,dirty=false;
const $=id=>document.getElementById(id);
async function boot(){
 try{
   db=getSeed();
   // Supabase becomes the source of truth only when the administrator session
   // and database are available. Otherwise the confirmed local seed remains usable.
   if(window.learningHubDb){
     try{
       const session=await window.learningHubDb.getSession();
       if(session){
         const remote=await window.learningHubDb.loadAll();
         if(remote.tracks.length && remote.contents.length) db=remote;
       }
     }catch(remoteError){
       console.warn('[Learning Hub] Remote load failed; using local seed.', remoteError);
     }
   }
 }catch(e){
   document.getElementById('nav').innerHTML='<div style="padding:18px;color:#b42318;font-size:12px;line-height:1.6"><b>CMS 초기화 오류</b><br>'+e.message+'<br><br>압축을 푼 폴더에서 admin/index.html을 다시 열어 주세요.</div>';
   document.getElementById('contentCount').textContent='DATA LOAD ERROR';
   setState('초기화 오류',false);
   return;
 }
 if(!db.tracks.length || !db.contents.length){
   document.getElementById('nav').innerHTML='<div style="padding:18px;color:#b42318;font-size:12px">초기 Track/Content 데이터가 비어 있습니다.</div>';
   setState('데이터 없음',false); return;
 }
 selected=db.contents[0]||null;bind();drawNav();if(selected)load(selected.id);else empty();setState('준비됨',true)}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function setState(t,ok=true){const a=$('stateText'),b=$('stateDot');if(a)a.textContent=t;if(b)b.style.background=ok?'#22c55e':'#f59e0b'}
function recount(){$('contentCount').textContent=`${db.tracks.length} TRACKS · ${db.contents.length} CONTENTS`}
function drawNav(q=''){recount();$('nav').innerHTML=db.tracks.map(t=>{const a=db.contents.filter(x=>x.track===t.num&&(!q||x.title.toLowerCase().includes(q.toLowerCase())));return `<div class="track-group"><h3>${esc(t.num)} · ${esc(t.name)} (${a.length})</h3>${a.map(x=>`<button class="nav-item ${selected&&selected.id===x.id?'active':''}" data-id="${x.id}">${esc(x.id)} ${esc(x.title)}</button>`).join('')}</div>`}).join('')}
function opts(sel){return '<option value="">— 없음 —</option>'+db.contents.map(x=>`<option value="${x.id}" ${x.id===sel?'selected':''}>${esc(x.id)} ${esc(x.title)}</option>`).join('')}
function empty(){$('titleHead').textContent='콘텐츠가 없습니다.';$('crumb').textContent='LEARNING HUB'}
function load(id){if(dirty&&!confirm('저장하지 않은 변경사항이 있습니다. 이동하시겠습니까?'))return;selected=db.contents.find(x=>x.id===id)||selected;if(!selected)return;dirty=false;if($('dirtyWarning'))$('dirtyWarning').hidden=true;
 $('crumb').textContent=`TRACK ${selected.track} · ${selected.trackName}`;$('titleHead').textContent=selected.title;$('track').value=`${selected.track} · ${selected.trackName}`;$('cid').value=selected.id;
 $('title').value=selected.title||'';$('summary').value=selected.summary||'';$('level').value=selected.level||'기본';$('time').value=selected.time||'';$('status').value=selected.status||'draft';
 $('learn').value=selected.learning?.learn||'';$('example').value=selected.learning?.example||'';$('check').value=selected.learning?.check||'';
 $('promptTitle').value=selected.assets?.prompt?.title||'';$('prompt').value=selected.assets?.prompt?.body||'';$('templateTitle').value=selected.assets?.template?.title||'';$('templateUrl').value=selected.assets?.template?.url||'';$('appTitle').value=selected.assets?.app?.title||'';$('appUrl').value=selected.assets?.app?.url||'';
 $('prev').innerHTML=opts(selected.flow?.prev||'');$('next').innerHTML=opts(selected.flow?.next||'');$('linkRows').innerHTML='';(selected.links||[]).forEach(addLinkRow);if($('savedAt'))$('savedAt').textContent=selected.updatedAt?'마지막 저장 · '+new Date(selected.updatedAt).toLocaleString():'저장 기록 없음';drawNav($('search').value)}
function addLinkRow(x={type:'VIDEO',title:'',url:''}){const d=document.createElement('div');d.className='link-row';d.innerHTML=`<select>${['VIDEO','ARTICLE','BLOG','FILE','APP','LINK'].map(o=>`<option ${o===x.type?'selected':''}>${o}</option>`).join('')}</select><input class="lt" placeholder="자료명" value="${esc(x.title||'')}"><input class="lu" placeholder="https://..." value="${esc(x.url||'')}"><button type="button">×</button>`;d.querySelector('button').onclick=()=>{d.remove();markDirty()};d.querySelectorAll('input,select').forEach(e=>e.oninput=markDirty);$('linkRows').appendChild(d)}
function collect(){const c=deep(selected);c.title=$('title').value.trim();c.summary=$('summary').value.trim();c.level=$('level').value;c.time=$('time').value.trim();c.status=$('status').value;c.learning={learn:$('learn').value,example:$('example').value,check:$('check').value};c.assets={prompt:{title:$('promptTitle').value,body:$('prompt').value},template:{title:$('templateTitle').value,url:$('templateUrl').value.trim()},app:{title:$('appTitle').value,url:$('appUrl').value.trim()}};c.links=[...document.querySelectorAll('.link-row')].map(r=>({type:r.querySelector('select').value,title:r.querySelector('.lt').value.trim(),url:r.querySelector('.lu').value.trim()}));c.flow={prev:$('prev').value,next:$('next').value};return c}
function validUrl(u){if(!u)return true;try{return ['http:','https:'].includes(new URL(u).protocol)}catch(e){return false}}
function validate(c){let e=[];if(!c.title)e.push('제목은 비워둘 수 없습니다.');[c.assets.template.url,c.assets.app.url,...c.links.map(x=>x.url)].filter(Boolean).forEach(u=>{if(!validUrl(u))e.push('URL 형식을 확인하세요: '+u)});if(c.flow.prev===c.id||c.flow.next===c.id)e.push('현재 콘텐츠를 이전/다음으로 지정할 수 없습니다.');return e}
async function save(){const c=collect(),errs=validate(c);if(errs.length){alert('저장하지 않았습니다.\n\n'+errs.join('\n'));return}
 try{
   if(!window.learningHubDb) throw new Error('Supabase 연결 모듈을 찾을 수 없습니다.');
   await window.learningHubDb.saveContent(c);
   c.updatedAt=new Date().toISOString();
   db.contents[db.contents.findIndex(x=>x.id===c.id)]=c;db.updatedAt=c.updatedAt;
   selected=c;dirty=false;if($('dirtyWarning'))$('dirtyWarning').hidden=true;
   toast('Supabase에 초안을 저장했습니다.');load(c.id);
 }catch(e){
   alert('초안을 저장하지 않았습니다.\n\n'+(e.message||e));
 }
}
function persist(){/* v0.7.1: operational data is no longer persisted to localStorage */}
function markDirty(){dirty=true;if($('dirtyWarning'))$('dirtyWarning').hidden=false;setState('미저장 변경',false)}
function nextTrackNum(){let nums=db.tracks.map(t=>parseInt(t.num,10)).filter(Number.isFinite);return String((nums.length?Math.max(...nums):0)+1).padStart(2,'0')}
async function addTrack(){if(dirty)return alert('먼저 현재 변경사항을 저장하세요.');const name=prompt('새 Track 이름을 입력하세요.');if(!name)return;const cleanName=name.trim();if(!cleanName)return;const num=nextTrackNum();const t={num,name:cleanName,desc:'',count:0};try{if(!window.learningHubDb)throw new Error('Supabase 연결 모듈을 찾을 수 없습니다.');await window.learningHubDb.saveTrack(t);db.tracks.push(t);drawNav();toast(`Supabase에 Track ${num}을 추가했습니다.`)}catch(e){alert('Track을 추가하지 않았습니다.\n\n'+(e.message||e))}}
async function addContent(){if(dirty)return alert('먼저 현재 변경사항을 저장하세요.');if(!db.tracks.length)return alert('먼저 Track을 추가하세요.');const list=db.tracks.map(t=>`${t.num}: ${t.name}`).join('\n');const tn=prompt('추가할 Track 번호를 입력하세요.\n\n'+list);const t=db.tracks.find(x=>x.num===tn);if(!t)return alert('Track 번호를 확인하세요.');const title=prompt('새 콘텐츠 제목을 입력하세요.');if(!title)return;const siblings=db.contents.filter(x=>x.track===tn);const n=Math.max(0,...siblings.map(x=>parseInt(x.id.split('-')[1],10)||0))+1;const id=`${tn}-${String(n).padStart(2,'0')}`;const c={id,track:tn,trackName:t.name,title:title.trim(),summary:'',level:'기본',time:'준비 중',status:'draft',learning:{learn:'',example:'',check:''},assets:{prompt:{title:'',body:''},template:{title:'',url:''},app:{title:'',url:''}},links:[],flow:{prev:'',next:''},updatedAt:null};try{if(!window.learningHubDb)throw new Error('Supabase 연결 모듈을 찾을 수 없습니다.');await window.learningHubDb.saveContent(c);c.updatedAt=new Date().toISOString();db.contents.push(c);t.count=(t.count||0)+1;selected=c;dirty=false;drawNav();load(id);toast(`Supabase에 ${id} 콘텐츠를 추가했습니다.`)}catch(e){alert('콘텐츠를 추가하지 않았습니다.\n\n'+(e.message||e))}}
function exportBackup(){const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`learning-hub-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function importBackup(file){const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(x.schemaVersion!==1||!Array.isArray(x.contents)||!Array.isArray(x.tracks))throw Error();if(!confirm('현재 CMS 데이터를 백업 파일로 교체하시겠습니까?'))return;db=x;persist();selected=db.contents[0]||null;dirty=false;drawNav();selected?load(selected.id):empty();toast('백업을 복원했습니다.')}catch(e){alert('호환되는 Learning Hub 백업 파일이 아닙니다.')}};r.readAsText(file)}
function toast(s){const t=$('toast');t.textContent=s;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function bind(){
 $('nav').onclick=e=>{if(e.target.dataset.id)load(e.target.dataset.id)};
 $('search').oninput=()=>drawNav($('search').value);
 if($('addTrackBtn'))$('addTrackBtn').onclick=addTrack;
 if($('addContentBtn'))$('addContentBtn').onclick=addContent;
 const tabs=document.querySelector('.tabs');
 if(tabs)tabs.onclick=e=>{if(!e.target.dataset.tab)return;document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));e.target.classList.add('active');document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===e.target.dataset.tab))};
 if($('addLink'))$('addLink').onclick=()=>{addLinkRow();markDirty()};
 if($('saveBtn'))$('saveBtn').onclick=e=>{e.preventDefault();save()};
 if($('previewBtn'))$('previewBtn').onclick=e=>{e.preventDefault();if(selected)window.open(`../lesson.html?id=${selected.id}`,'_blank')};
 if($('exportBtn'))$('exportBtn').onclick=exportBackup;
 if($('importFile'))$('importFile').onchange=e=>{if(e.target.files[0])importBackup(e.target.files[0]);e.target.value=''};
 document.querySelectorAll('#form input:not(:disabled),#form textarea,#form select').forEach(e=>e.addEventListener('input',markDirty));
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}})
}
boot()})();