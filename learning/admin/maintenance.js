(()=>{
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
function downloadJson(data,prefix){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});const a=document.createElement('a');const stamp=new Date().toISOString().replace(/[:.]/g,'-');a.href=URL.createObjectURL(blob);a.download=`${prefix}-${stamp}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function checkRow(label,value,state='ok'){const cls=state==='bad'?'badtxt':state==='warn'?'warntxt':'oktxt';return `<div class="check"><span>${esc(label)}</span><span class="${cls}">${esc(value)}</span></div>`}
async function refresh(){
 try{
  if(!window.learningHubDb)throw new Error('Supabase 연결 모듈을 찾을 수 없습니다.');
  const h=await window.learningHubDb.healthCheck();
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
 }catch(e){$('checks').innerHTML=checkRow('점검 실패',e.message||e,'bad')}
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
$('refreshBtn').onclick=refresh;$('loadRevBtn').onclick=loadRevisions;$('contentSelect').onchange=loadRevisions;$('backupBtn').onclick=async()=>{try{const b=await window.learningHubDb.createBackup();downloadJson(b,'learning-hub-backup');toast('현재 상태 백업 완료')}catch(e){alert(e.message||e)}};
refresh().then(loadRevisions);
})();
