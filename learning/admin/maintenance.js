(()=>{
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
let inventory=[];
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
function downloadJson(data,prefix){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});const a=document.createElement('a');const stamp=new Date().toISOString().replace(/[:.]/g,'-');a.href=URL.createObjectURL(blob);a.download=`${prefix}-${stamp}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function checkRow(label,value,state='ok'){const cls=state==='bad'?'badtxt':state==='warn'?'warntxt':'oktxt';return `<div class="check"><span>${esc(label)}</span><span class="${cls}">${esc(value)}</span></div>`}
function validUrl(u){if(!u)return true;try{return ['http:','https:'].includes(new URL(u).protocol)}catch(e){return false}}
function readiness(c){
 const issues=[];
 if(!String(c.title||'').trim())issues.push('제목');
 if(!String(c.summary||'').trim())issues.push('설명');
 const learning=c.learning||{},assets=c.assets||{},links=Array.isArray(c.links)?c.links:[];
 const hasLearning=[learning.learn,learning.example,learning.check].some(x=>String(x||'').trim());
 const hasAsset=String(assets?.prompt?.body||'').trim()||String(assets?.template?.url||'').trim()||String(assets?.app?.url||'').trim();
 const hasLink=links.some(x=>String(x?.url||'').trim());
 if(!hasLearning&&!hasAsset&&!hasLink)issues.push('학습자료');
 const urls=[assets?.template?.url,assets?.app?.url,...links.map(x=>x?.url)].filter(x=>String(x||'').trim());
 if(urls.some(u=>!validUrl(u)))issues.push('URL');
 if(c.flow?.prev===c.id||c.flow?.next===c.id)issues.push('연결');
 return {ready:issues.length===0,issues};
}
function csvCell(v){const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function exportCsv(){
 if(!inventory.length)return alert('내보낼 콘텐츠가 없습니다.');
 const rows=[['content_id','track','track_name','title','status','level','expected_time','publish_ready','issues','updated_at']];
 inventory.forEach(c=>{const r=readiness(c);rows.push([c.id,c.track,c.trackName,c.title,c.status,c.level,c.time,r.ready?'yes':'no',r.issues.join('|'),c.updatedAt||''])});
 const text='\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\n');
 const blob=new Blob([text],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download='learning-hub-content-inventory-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('콘텐츠 CSV를 저장했습니다.');
}
function renderInventory(){
 const q=$('invSearch').value.trim().toLowerCase(),track=$('invTrack').value,status=$('invStatus').value,ready=$('invReady').value;
 const rows=inventory.filter(c=>{
   const r=readiness(c);
   if(q&&!(`${c.id} ${c.title}`.toLowerCase().includes(q)))return false;
   if(track&&c.track!==track)return false;
   if(status&&c.status!==status)return false;
   if(ready==='ready'&&!r.ready)return false;
   if(ready==='review'&&r.ready)return false;
   return true;
 });
 const counts={public:rows.filter(c=>c.status==='public').length,draft:rows.filter(c=>c.status==='draft').length,hidden:rows.filter(c=>c.status==='hidden').length,ready:rows.filter(c=>readiness(c).ready).length};
 $('inventorySummary').textContent=`표시 ${rows.length}개 · 공개 ${counts.public} · 초안 ${counts.draft} · 비공개 ${counts.hidden} · 게시 준비 완료 ${counts.ready}`;
 if(!rows.length){$('inventoryList').innerHTML='<div class="empty">조건에 맞는 콘텐츠가 없습니다.</div>';return}
 const body=rows.map(c=>{const r=readiness(c);const statusLabel=c.status==='public'?'공개':c.status==='hidden'?'비공개':'초안';const issueText=r.ready?'게시 조건 충족':r.issues.join(' · ');return `<tr><td><b>${esc(c.id)}</b></td><td>${esc(c.track)} · ${esc(c.trackName)}</td><td>${esc(c.title)}<div class="inv-meta">${esc(c.summary||'설명 없음')}</div></td><td><span class="chip ${esc(c.status)}">${statusLabel}</span></td><td><span class="chip ${r.ready?'ready':'review'}">${r.ready?'준비 완료':'보완 필요'}</span><div class="inv-meta">${esc(issueText)}</div></td><td>${c.updatedAt?esc(new Date(c.updatedAt).toLocaleString()):'-'}</td><td><a href="index.html?content=${encodeURIComponent(c.id)}">CMS에서 열기</a>${c.status==='public'?` <a href="../lesson.html?id=${encodeURIComponent(c.id)}" target="_blank">공개 보기</a>`:''}</td></tr>`}).join('');
 $('inventoryList').innerHTML=`<table class="inventory-table"><thead><tr><th>ID</th><th>Track</th><th>제목</th><th>상태</th><th>게시 준비</th><th>최근 저장</th><th></th></tr></thead><tbody>${body}</tbody></table>`;
}
async function refresh(){
 try{
  if(!window.learningHubDb)throw new Error('Supabase 연결 모듈을 찾을 수 없습니다.');
  const [h,all]=await Promise.all([window.learningHubDb.healthCheck(),window.learningHubDb.loadAll()]);
  inventory=all.contents||[];
  $('trackCount').textContent=h.counts.tracks;$('contentCount').textContent=h.counts.contents;$('publicCount').textContent=h.counts.public;$('revisionCount').textContent=h.counts.revisions;
  const rows=[];
  rows.push(checkRow('Supabase 연결','정상'));
  rows.push(checkRow('고아 콘텐츠',h.orphanContents.length?`${h.orphanContents.length}건`:'없음',h.orphanContents.length?'bad':'ok'));
  rows.push(checkRow('잘못된 이전·다음 연결',h.invalidFlow.length?`${h.invalidFlow.length}건`:'없음',h.invalidFlow.length?'bad':'ok'));
  rows.push(checkRow('공개 콘텐츠 설명 누락',h.publicMissingSummary.length?`${h.publicMissingSummary.length}건`:'없음',h.publicMissingSummary.length?'warn':'ok'));
  rows.push(checkRow('공개 콘텐츠 학습자료 없음',h.publicEmptyLearning.length?`${h.publicEmptyLearning.length}건`:'없음',h.publicEmptyLearning.length?'warn':'ok'));
  rows.push(checkRow('형식이 잘못된 URL',h.invalidUrls.length?`${h.invalidUrls.length}건`:'없음',h.invalidUrls.length?'warn':'ok'));
  $('checks').innerHTML=rows.join('');$('checkedAt').textContent='마지막 점검 · '+new Date().toLocaleString();
  const current=$('contentSelect').value;const options=h.contents.map(c=>`<option value="${esc(c.id)}">${esc(c.id)} · ${esc(c.title)}</option>`).join('');$('contentSelect').innerHTML=options;if(current&&h.contents.some(c=>c.id===current))$('contentSelect').value=current;
  const curTrack=$('invTrack').value;$('invTrack').innerHTML='<option value="">전체</option>'+all.tracks.map(t=>`<option value="${esc(t.num)}">${esc(t.num)} · ${esc(t.name)}</option>`).join('');if(curTrack&&all.tracks.some(t=>t.num===curTrack))$('invTrack').value=curTrack;
  renderInventory();
 }catch(e){$('checks').innerHTML=checkRow('점검 실패',e.message||e,'bad');$('inventoryList').innerHTML=`<div class="empty badtxt">${esc(e.message||e)}</div>`}
}
async function loadRevisions(){
 const code=$('contentSelect').value;if(!code)return;
 $('revisionList').innerHTML='<div class="empty">이력을 불러오는 중입니다.</div>';
 try{
  const rows=await window.learningHubDb.getRevisions(code,30);
  if(!rows.length){$('revisionList').innerHTML='<div class="empty">저장된 revision 이력이 없습니다.</div>';return}
  const body=rows.map(r=>{const s=r.snapshot||{};const title=s.title||s.content_code||s.id||'';const status=s.status||'';return `<tr><td>${esc(new Date(r.created_at).toLocaleString())}</td><td>${esc(r.action)}</td><td>${esc(title)}</td><td>${esc(status)}</td><td><button data-rid="${esc(r.id)}">이 시점으로 복구</button></td></tr>`}).join('');
  $('revisionList').innerHTML=`<table class="rev-table"><thead><tr><th>시각</th><th>동작</th><th>제목</th><th>상태</th><th></th></tr></thead><tbody>${body}</tbody></table>`;
  $('revisionList').querySelectorAll('button[data-rid]').forEach(b=>b.onclick=()=>restoreRevision(Number(b.dataset.rid),code));
 }catch(e){$('revisionList').innerHTML=`<div class="empty badtxt">${esc(e.message||e)}</div>`}
}
async function restoreRevision(id,code){
 if(!confirm(`${code} 콘텐츠를 선택한 revision 시점으로 되돌리시겠습니까?\n\n복구 직전에 전체 Learning Hub 백업 JSON을 자동 저장합니다.`))return;
 try{
  const backup=await window.learningHubDb.createBackup();downloadJson(backup,'learning-hub-before-revision-restore');
  const result=await window.learningHubDb.restoreRevision(id,code);toast(`revision 복구 완료 · ${result.contentCode}`);await refresh();await loadRevisions();
 }catch(e){alert('revision을 복구하지 않았습니다.\n\n'+(e.message||e))}
}
$('refreshBtn').onclick=async()=>{await refresh();await loadRevisions()};$('loadRevBtn').onclick=loadRevisions;$('contentSelect').onchange=loadRevisions;$('backupBtn').onclick=async()=>{try{const b=await window.learningHubDb.createBackup();downloadJson(b,'learning-hub-backup');toast('현재 상태 백업 완료')}catch(e){alert(e.message||e)}};$('csvBtn').onclick=exportCsv;
['invSearch','invTrack','invStatus','invReady'].forEach(id=>{$(id).addEventListener(id==='invSearch'?'input':'change',renderInventory)});
$('clearFiltersBtn').onclick=()=>{$('invSearch').value='';$('invTrack').value='';$('invStatus').value='';$('invReady').value='';renderInventory()};
refresh().then(loadRevisions);
})();
