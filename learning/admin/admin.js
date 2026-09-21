(()=>{const STORAGE='learningHubCmsV06';const deep=x=>JSON.parse(JSON.stringify(x));
function getSeed(){
  const raw=window.INITIAL_CMS_DATA;
  if(!raw) throw new Error('초기 CMS 데이터(cms-seed.js)를 찾을 수 없습니다.');
  const data=typeof raw==='string'?JSON.parse(raw):deep(raw);
  if(!data || !Array.isArray(data.tracks) || !Array.isArray(data.contents)) throw new Error('초기 CMS 데이터 형식이 올바르지 않습니다.');
  return data;
}
let db=null,selected=null,dirty=false,saveBusy=false;
const $=id=>document.getElementById(id);
async function boot(){
 let remoteLoaded=false;
 try{
   db=getSeed();
   // Supabase becomes the source of truth only when the administrator session
   // and database are available. Otherwise the confirmed local seed remains usable.
   if(window.learningHubDb){
     try{
       const session=await window.learningHubDb.getSession();
       if(session){
         const remote=await window.learningHubDb.loadAll();
         if(remote.tracks.length && remote.contents.length){db=remote;remoteLoaded=true;}
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
 const requestedId=new URLSearchParams(location.search).get('content');
 selected=(requestedId&&db.contents.find(x=>x.id===requestedId))||db.contents[0]||null;bind();drawNav();if(selected)load(selected.id);else empty();setState(remoteLoaded?'Supabase 연결':'로컬 Seed 사용',remoteLoaded)}
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
 $('prev').innerHTML=opts(selected.flow?.prev||'');$('next').innerHTML=opts(selected.flow?.next||'');$('linkRows').innerHTML='';(selected.links||[]).forEach(addLinkRow);renderBlockRows(selected.assets?.blocks||[]);if($('savedAt'))$('savedAt').textContent=selected.updatedAt?'마지막 저장 · '+new Date(selected.updatedAt).toLocaleString():'저장 기록 없음';drawNav($('search').value);if($('assetList'))refreshAssetList(false);renderPublishCheck()}
function addLinkRow(x={type:'VIDEO',title:'',url:''}){const d=document.createElement('div');d.className='link-row';d.innerHTML=`<select>${['VIDEO','ARTICLE','BLOG','FILE','APP','LINK'].map(o=>`<option ${o===x.type?'selected':''}>${o}</option>`).join('')}</select><input class="lt" placeholder="자료명" value="${esc(x.title||'')}"><input class="lu" placeholder="https://..." value="${esc(x.url||'')}"><button type="button">×</button>`;d.querySelector('button').onclick=()=>{d.remove();markDirty()};d.querySelectorAll('input,select').forEach(e=>e.oninput=markDirty);$('linkRows').appendChild(d)}
const BLOCK_TYPES=['TEXT','IMAGE','VIDEO','LINK','FILE','APP','NOTICE','CHECKLIST','TABLE','PROMPT'];
const BLOCK_SECTIONS=[['learn','LEARN'],['understand','UNDERSTAND'],['practice','PRACTICE'],['review','REVIEW']];
const BODY_BLOCK_TYPES=new Set(['TEXT','NOTICE','CHECKLIST','TABLE','PROMPT']);
const URL_BLOCK_TYPES=new Set(['IMAGE','VIDEO','LINK','FILE','APP']);
function blockId(){return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():('b-'+Date.now()+'-'+Math.random().toString(36).slice(2,8))}
function normalizeBlock(b={},i=0){const type=BLOCK_TYPES.includes(String(b.type||'').toUpperCase())?String(b.type).toUpperCase():'TEXT';const section=BLOCK_SECTIONS.some(x=>x[0]===b.section)?b.section:'learn';return {id:b.id||blockId(),section,type,title:b.title||'',body:b.body||'',url:b.url||'',caption:b.caption||'',order:Number(b.order)||i+1}}
function blockFromRow(r,i=0){return normalizeBlock({id:r.dataset.blockId,section:r.querySelector('.bs').value,type:r.querySelector('.bt').value,title:r.querySelector('.btitle').value.trim(),body:r.querySelector('.bbody').value,url:r.querySelector('.burl').value.trim(),caption:r.querySelector('.bcaption').value.trim(),order:i+1},i)}
function collectBlocks(){return [...document.querySelectorAll('.content-block-editor')].map(blockFromRow).filter(b=>b.title||b.body.trim()||b.url||b.caption)}
function updateBlockFields(r){const type=r.querySelector('.bt').value;const body=r.querySelector('.block-body-field'),url=r.querySelector('.block-url-field'),caption=r.querySelector('.block-caption-field'),upload=r.querySelector('.block-upload');if(body)body.hidden=!BODY_BLOCK_TYPES.has(type);if(url)url.hidden=!URL_BLOCK_TYPES.has(type);if(caption)caption.hidden=!URL_BLOCK_TYPES.has(type);if(upload)upload.hidden=!['IMAGE','FILE'].includes(type);const hint=r.querySelector('.block-type-hint');if(hint){const map={TEXT:'보충 설명·Tutor Note',IMAGE:'이미지 URL 또는 Storage 업로드',VIDEO:'YouTube·영상 URL',LINK:'웹페이지 링크',FILE:'PDF·DOCX·XLSX 등 파일',APP:'외부 도구·앱',NOTICE:'주의사항·Tip·핵심 알림',CHECKLIST:'한 줄에 한 항목',TABLE:'행은 줄바꿈, 열은 | 또는 탭으로 구분',PROMPT:'추가 실습 프롬프트'};hint.textContent=map[type]||''}}
function renderBlockRows(blocks=[]){const host=$('blockRows');if(!host)return;host.innerHTML='';(blocks||[]).map(normalizeBlock).sort((a,b)=>a.order-b.order).forEach(addBlockRow);if(!host.children.length)host.innerHTML='<div class="block-empty">추가 자료가 없습니다. 학습자 화면에는 빈 박스가 표시되지 않습니다.</div>'}
function addBlockRow(block={}){const host=$('blockRows');if(!host)return;if(host.querySelector('.block-empty'))host.innerHTML='';const b=normalizeBlock(block,host.children.length);const d=document.createElement('div');d.className='content-block-editor';d.dataset.blockId=b.id;d.innerHTML=`<div class="block-toolbar"><span class="block-index">자료 ${host.children.length+1}</span><div><button type="button" class="block-up" title="위로">↑</button><button type="button" class="block-down" title="아래로">↓</button><button type="button" class="block-delete" title="삭제">삭제</button></div></div><div class="block-grid"><label>표시 영역<select class="bs">${BLOCK_SECTIONS.map(([v,l])=>`<option value="${v}" ${v===b.section?'selected':''}>${l}</option>`).join('')}</select></label><label>자료 유형<select class="bt">${BLOCK_TYPES.map(v=>`<option ${v===b.type?'selected':''}>${v}</option>`).join('')}</select></label></div><label>제목<input class="btitle" value="${esc(b.title)}" placeholder="학습자에게 보일 자료 제목"></label><label class="block-body-field">내용<textarea class="bbody" rows="5" placeholder="텍스트·체크리스트·표·프롬프트 내용을 입력">${esc(b.body)}</textarea></label><label class="block-url-field">URL<input class="burl" value="${esc(b.url)}" placeholder="https://..."></label><label class="block-caption-field">설명 / 캡션<input class="bcaption" value="${esc(b.caption)}" placeholder="선택 사항"></label><div class="block-actions"><button type="button" class="ghost block-upload">파일 업로드</button><input type="file" class="block-file" hidden><small class="block-type-hint"></small></div>`;host.appendChild(d);updateBlockFields(d);d.querySelectorAll('input:not([type="file"]),textarea,select').forEach(el=>el.addEventListener('input',()=>{if(el.classList.contains('bt'))updateBlockFields(d);markDirty()}));d.querySelector('.bt').addEventListener('change',()=>{updateBlockFields(d);markDirty()});d.querySelector('.block-up').onclick=()=>{const prev=d.previousElementSibling;if(prev){host.insertBefore(d,prev);renumberBlocks();markDirty()}};d.querySelector('.block-down').onclick=()=>{const next=d.nextElementSibling;if(next){host.insertBefore(next,d);renumberBlocks();markDirty()}};d.querySelector('.block-delete').onclick=()=>deleteBlockRow(d);const fileInput=d.querySelector('.block-file');d.querySelector('.block-upload').onclick=()=>fileInput.click();fileInput.onchange=e=>{if(e.target.files[0])uploadBlockFile(d,e.target.files[0]);e.target.value=''};renumberBlocks()}
function renumberBlocks(){[...document.querySelectorAll('.content-block-editor')].forEach((r,i)=>{const n=r.querySelector('.block-index');if(n)n.textContent=`자료 ${i+1}`})}
async function uploadBlockFile(row,file){if(!selected||!file)return;const before=blockFromRow(row);let info=null;try{const btn=row.querySelector('.block-upload');btn.disabled=true;btn.textContent='업로드 중...';info=await window.learningHubDb.uploadAsset(file,selected.id);const type=file.type&&file.type.startsWith('image/')?'IMAGE':'FILE';row.querySelector('.bt').value=type;row.querySelector('.burl').value=info.publicUrl;if(!row.querySelector('.btitle').value.trim())row.querySelector('.btitle').value=info.name;updateBlockFields(row);await persistAssetChange('확장자료 파일을 업로드하고 저장했습니다.');await refreshAssetList(false)}catch(e){if(info?.path){try{await window.learningHubDb.deleteAsset(info.path)}catch(_){}}row.querySelector('.bs').value=before.section;row.querySelector('.bt').value=before.type;row.querySelector('.btitle').value=before.title;row.querySelector('.bbody').value=before.body;row.querySelector('.burl').value=before.url;row.querySelector('.bcaption').value=before.caption;updateBlockFields(row);alert('확장자료 파일을 업로드하지 않았습니다.\n\n'+(e.message||e))}finally{const btn=row.querySelector('.block-upload');btn.disabled=false;btn.textContent='파일 업로드'}}
async function deleteBlockRow(row){const rows=[...document.querySelectorAll('.content-block-editor')],idx=rows.indexOf(row),target=blockFromRow(row,Math.max(idx,0)),all=rows.map((r,i)=>blockFromRow(r,i)).filter(b=>b.title||String(b.body||'').trim()||b.url||b.caption);if(!confirm(`확장자료 블록을 삭제하시겠습니까?\n\n${target.title||target.type}\n\n콘텐츠 연결만 삭제하며, 업로드된 Storage 파일은 안전을 위해 파일 목록에 남겨둡니다.`))return;const keep=rows.filter(r=>r!==row).map((r,i)=>blockFromRow(r,i)).filter(b=>b.title||String(b.body||'').trim()||b.url||b.caption);try{renderBlockRows(keep);await persistAssetChange('확장자료 블록을 삭제했습니다.');await refreshAssetList(false)}catch(e){renderBlockRows(all);alert('확장자료를 삭제하지 않았습니다.\n\n'+(e.message||e))}}
function collect(){const c=deep(selected);c.title=$('title').value.trim();c.summary=$('summary').value.trim();c.level=$('level').value;c.time=$('time').value.trim();c.status=$('status').value;c.learning={learn:$('learn').value,example:$('example').value,check:$('check').value};c.assets={prompt:{title:$('promptTitle').value,body:$('prompt').value},template:{title:$('templateTitle').value,url:$('templateUrl').value.trim()},app:{title:$('appTitle').value,url:$('appUrl').value.trim()},blocks:collectBlocks()};c.links=[...document.querySelectorAll('.link-row')].map(r=>({type:r.querySelector('select').value,title:r.querySelector('.lt').value.trim(),url:r.querySelector('.lu').value.trim()}));c.flow={prev:$('prev').value,next:$('next').value};return c}
function validUrl(u){if(!u)return true;try{return ['http:','https:'].includes(new URL(u).protocol)}catch(e){return false}}
function validate(c){let e=[];if(!c.title)e.push('제목은 비워둘 수 없습니다.');[c.assets.template.url,c.assets.app.url,...c.links.map(x=>x.url),...(c.assets.blocks||[]).map(x=>x.url)].filter(Boolean).forEach(u=>{if(!validUrl(u))e.push('URL 형식을 확인하세요: '+u)});(c.assets.blocks||[]).forEach((b,i)=>{const meaningful=b.title||String(b.body||'').trim()||b.url||b.caption;if(!meaningful)return;if(URL_BLOCK_TYPES.has(b.type)&&!b.url)e.push(`확장자료 ${i+1}(${b.type})에 URL이 필요합니다.`);if(BODY_BLOCK_TYPES.has(b.type)&&!String(b.body||'').trim())e.push(`확장자료 ${i+1}(${b.type})에 내용이 필요합니다.`)});if(c.flow.prev===c.id||c.flow.next===c.id)e.push('현재 콘텐츠를 이전/다음으로 지정할 수 없습니다.');return [...new Set(e)]}
function publishValidation(c){const e=validate(c);if(!c.summary.trim())e.push('공개 콘텐츠에는 한 줄 설명이 필요합니다.');const hasLearning=[c.learning.learn,c.learning.example,c.learning.check].some(x=>String(x||'').trim());const hasBlock=(c.assets.blocks||[]).some(b=>b.title||String(b.body||'').trim()||b.url);const hasAsset=String(c.assets.prompt.body||'').trim()||String(c.assets.template.url||'').trim()||String(c.assets.app.url||'').trim()||hasBlock;const hasLink=(c.links||[]).some(x=>String(x.url||'').trim());if(!hasLearning&&!hasAsset&&!hasLink)e.push('학습내용·프롬프트·파일·앱·외부자료·확장자료 중 하나 이상을 입력하세요.');return [...new Set(e)]}
function renderPublishCheck(){if(!$('publishCheck')||!selected)return;let c;try{c=collect()}catch(e){return}const issues=publishValidation(c);const box=$('publishCheck'),text=$('publishCheckText');box.classList.remove('ok','warn','bad');if(c.status!=='public'){box.classList.add(issues.length?'warn':'ok');text.textContent=issues.length?`현재 초안 · 게시 전 보완 ${issues.length}건: ${issues.join(' / ')}`:'현재 초안 · 게시 준비 조건을 충족합니다.';return}box.classList.add(issues.length?'bad':'ok');text.textContent=issues.length?`게시할 수 없음 · ${issues.join(' / ')}`:'게시 준비 완료 · 저장하면 공개 사이트에 반영됩니다.'}
function operationalError(action,e){console.error('[Learning Hub]',action,e);setState(action+' 오류',false);alert(`${action}에 실패했습니다.\n\n${e&&e.message?e.message:e}`)}

async function save(){
 if(saveBusy){toast('저장 작업을 처리 중입니다.');return}
 const c=collect(),errs=validate(c);if(errs.length){alert('저장하지 않았습니다.\n\n'+errs.join('\n'));return}
 const isPublish=c.status==='public';
 if(isPublish){const publishErrs=publishValidation(c);if(publishErrs.length){alert('게시하지 않았습니다.\n\n'+publishErrs.join('\n'));return}}
 const btn=$('saveBtn'),oldText=btn?btn.textContent:'';
 try{
   saveBusy=true;
   if(btn){btn.disabled=true;btn.textContent=isPublish?'게시 중...':'저장 중...'}
   setState(isPublish?'게시 중':'저장 중',false);
   if(!window.learningHubDb) throw new Error('Supabase 연결 모듈을 찾을 수 없습니다.');
   if(isPublish){
     await window.learningHubDb.publishContent(c);
   }else{
     await window.learningHubDb.saveContent(c);
   }
   c.updatedAt=new Date().toISOString();
   db.contents[db.contents.findIndex(x=>x.id===c.id)]=c;db.updatedAt=c.updatedAt;
   selected=c;dirty=false;if($('dirtyWarning'))$('dirtyWarning').hidden=true;
   toast(isPublish?'Supabase에 게시했습니다.':'Supabase에 초안을 저장했습니다.');load(c.id);
 }catch(e){
   alert((isPublish?'게시하지 않았습니다.':'초안을 저장하지 않았습니다.')+'\n\n'+(e.message||e));
 }finally{
   saveBusy=false;
   if(btn){btn.disabled=false;btn.textContent=oldText||'변경사항 임시 저장'}
   setState(dirty?'미저장 변경':'준비됨',!dirty);
 }
}
function persist(){/* v0.7.1: operational data is no longer persisted to localStorage */}
function markDirty(){dirty=true;if($('dirtyWarning'))$('dirtyWarning').hidden=false;setState('미저장 변경',false);renderPublishCheck()}
function nextTrackNum(){let nums=db.tracks.map(t=>parseInt(t.num,10)).filter(Number.isFinite);return String((nums.length?Math.max(...nums):0)+1).padStart(2,'0')}
async function addTrack(){if(dirty)return alert('먼저 현재 변경사항을 저장하세요.');const name=prompt('새 Track 이름을 입력하세요.');if(!name)return;const cleanName=name.trim();if(!cleanName)return;const num=nextTrackNum();const t={num,name:cleanName,desc:'',count:0};try{if(!window.learningHubDb)throw new Error('Supabase 연결 모듈을 찾을 수 없습니다.');await window.learningHubDb.saveTrack(t);db.tracks.push(t);drawNav();toast(`Supabase에 Track ${num}을 추가했습니다.`)}catch(e){alert('Track을 추가하지 않았습니다.\n\n'+(e.message||e))}}
async function addContent(){if(dirty)return alert('먼저 현재 변경사항을 저장하세요.');if(!db.tracks.length)return alert('먼저 Track을 추가하세요.');const list=db.tracks.map(t=>`${t.num}: ${t.name}`).join('\n');const tn=prompt('추가할 Track 번호를 입력하세요.\n\n'+list);const t=db.tracks.find(x=>x.num===tn);if(!t)return alert('Track 번호를 확인하세요.');const title=prompt('새 콘텐츠 제목을 입력하세요.');if(!title)return;const siblings=db.contents.filter(x=>x.track===tn);const n=Math.max(0,...siblings.map(x=>parseInt(x.id.split('-')[1],10)||0))+1;const id=`${tn}-${String(n).padStart(2,'0')}`;const c={id,track:tn,trackName:t.name,title:title.trim(),summary:'',level:'기본',time:'준비 중',status:'draft',learning:{learn:'',example:'',check:''},assets:{prompt:{title:'',body:''},template:{title:'',url:''},app:{title:'',url:''},blocks:[]},links:[],flow:{prev:'',next:''},updatedAt:null};try{if(!window.learningHubDb)throw new Error('Supabase 연결 모듈을 찾을 수 없습니다.');await window.learningHubDb.saveContent(c);c.updatedAt=new Date().toISOString();db.contents.push(c);t.count=(t.count||0)+1;selected=c;dirty=false;drawNav();load(id);toast(`Supabase에 ${id} 콘텐츠를 추가했습니다.`)}catch(e){alert('콘텐츠를 추가하지 않았습니다.\n\n'+(e.message||e))}}
function formatBytes(n){
 const v=Number(n)||0;
 if(v<1024)return `${v} B`;
 if(v<1024*1024)return `${(v/1024).toFixed(1)} KB`;
 return `${(v/1024/1024).toFixed(1)} MB`;
}
async function persistAssetChange(message){
 const c=collect(),errs=validate(c);
 if(errs.length)throw new Error(errs.join('\n'));
 const isPublish=c.status==='public';
 if(isPublish){const publishErrs=publishValidation(c);if(publishErrs.length)throw new Error(publishErrs.join('\n'));}
 if(isPublish)await window.learningHubDb.publishContent(c);
 else await window.learningHubDb.saveContent(c);
 c.updatedAt=new Date().toISOString();
 const idx=db.contents.findIndex(x=>x.id===c.id);
 if(idx>=0)db.contents[idx]=c;
 selected=c;dirty=false;
 if($('dirtyWarning'))$('dirtyWarning').hidden=true;
 drawNav($('search').value);
 toast(message);setState(isPublish?'게시 완료':'저장 완료',true);renderPublishCheck();
 return c;
}
async function refreshAssetList(showToast=false){
 if(!$('assetList')||!selected||!window.learningHubDb)return;
 const contentId=selected.id;
 $('assetList').innerHTML='<div class="help">파일 목록을 불러오는 중...</div>';
 try{
   const items=await window.learningHubDb.listAssets(contentId);
   if(!selected||selected.id!==contentId)return;
   const currentPath=window.learningHubDb.assetPathFromPublicUrl($('templateUrl').value.trim());
   $('assetList').innerHTML='';
   if(!items.length){
     $('assetList').innerHTML='<div class="help">이 콘텐츠에 업로드된 파일이 없습니다.</div>';
     if(showToast)toast('업로드된 파일이 없습니다.');
     return;
   }
   items.forEach(item=>{
     const row=document.createElement('div');
     row.style.cssText='display:flex;gap:8px;align-items:center;justify-content:space-between;padding:9px 10px;margin-top:6px;border:1px solid #e5e7eb;border-radius:8px;background:#fff';
     const meta=document.createElement('div');
     meta.style.cssText='min-width:0;flex:1';
     const name=document.createElement('div');
     name.style.cssText='font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
     name.textContent=(currentPath===item.path?'● ':'')+item.name;
     const sub=document.createElement('div');
     sub.className='help';
     sub.style.margin='3px 0 0';
     sub.textContent=`${formatBytes(item.size)}${item.createdAt?' · '+new Date(item.createdAt).toLocaleString():''}`;
     meta.append(name,sub);
     const actions=document.createElement('div');
     actions.style.cssText='display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end';
     const use=document.createElement('button');
     use.type='button';use.className='ghost';use.textContent=currentPath===item.path?'연결됨':'이 파일 사용';
     use.disabled=currentPath===item.path;
     use.onclick=()=>useStoredAsset(item);
     const open=document.createElement('button');
     open.type='button';open.className='ghost';open.textContent='열기';
     open.onclick=()=>window.open(item.publicUrl,'_blank');
     const del=document.createElement('button');
     del.type='button';del.className='ghost';del.textContent='삭제';
     del.onclick=()=>deleteStoredAsset(item);
     actions.append(use,open,del);
     row.append(meta,actions);
     $('assetList').appendChild(row);
   });
   if(showToast)toast(`파일 ${items.length}개를 확인했습니다.`);
 }catch(e){
   $('assetList').innerHTML='<div class="help" style="color:#b42318">파일 목록을 불러오지 못했습니다.</div>';
   if(showToast)alert('파일 목록을 불러오지 못했습니다.\n\n'+(e.message||e));
 }
}
async function useStoredAsset(item){
 if(!item||!item.publicUrl)return;
 const oldUrl=$('templateUrl').value;
 try{
   if(!$('templateTitle').value.trim())$('templateTitle').value=item.name;
   $('templateUrl').value=item.publicUrl;
   await persistAssetChange('선택한 파일을 콘텐츠에 연결했습니다.');
   await refreshAssetList(false);
 }catch(e){
   $('templateUrl').value=oldUrl;
   alert('파일 연결을 저장하지 않았습니다.\n\n'+(e.message||e));
 }
}
async function deleteStoredAsset(item){
 if(!item||!item.path)return;
 const currentPath=window.learningHubDb.assetPathFromPublicUrl($('templateUrl').value.trim());
 const linked=currentPath===item.path;
 if(!confirm(`${linked?'현재 콘텐츠에 연결된 ':''}파일을 삭제하시겠습니까?\n\n${item.name}\n\nStorage의 실제 파일이 삭제됩니다.`))return;
 try{
   if(linked){
     const prevTitle=$('templateTitle').value,prevUrl=$('templateUrl').value;
     $('templateTitle').value='';
     $('templateUrl').value='';
     try{
       await persistAssetChange('콘텐츠의 파일 연결을 해제했습니다.');
     }catch(e){
       $('templateTitle').value=prevTitle;
       $('templateUrl').value=prevUrl;
       throw e;
     }
   }
   await window.learningHubDb.deleteAsset(item.path);
   if($('assetUploadStatus'))$('assetUploadStatus').textContent='파일 삭제 완료';
   toast(linked?'연결 파일을 삭제했습니다.':'Storage 파일을 삭제했습니다.');
   await refreshAssetList(false);
 }catch(e){
   alert('파일을 삭제하지 않았습니다.\n\n'+(e.message||e));
 }
}
async function uploadAssetFile(file){
 if(!file)return;
 if(!selected)return alert('먼저 콘텐츠를 선택하세요.');
 if(!window.learningHubDb)return alert('Supabase 연결 모듈을 찾을 수 없습니다.');
 const oldTitle=$('templateTitle').value;
 const oldUrl=$('templateUrl').value.trim();
 const parsedOldPath=window.learningHubDb.assetPathFromPublicUrl(oldUrl);
 const ownedPrefix=`learning/${selected.id}/`;
 const oldPath=parsedOldPath&&parsedOldPath.startsWith(ownedPrefix)?parsedOldPath:null;
 let info=null;
 try{
   if($('assetUploadBtn'))$('assetUploadBtn').disabled=true;
   if($('assetUploadStatus'))$('assetUploadStatus').textContent=oldPath?'교체 파일 업로드 중...':'업로드 중...';
   info=await window.learningHubDb.uploadAsset(file,selected.id);
   $('templateTitle').value=info.name;
   $('templateUrl').value=info.publicUrl;
   try{
     await persistAssetChange(oldPath?'파일을 교체하고 콘텐츠에 저장했습니다.':'파일을 업로드하고 콘텐츠에 저장했습니다.');
   }catch(saveError){
     try{await window.learningHubDb.deleteAsset(info.path)}catch(cleanupError){console.warn('[Learning Hub] Uploaded orphan cleanup failed.',cleanupError)}
     $('templateTitle').value=oldTitle;
     $('templateUrl').value=oldUrl;
     throw saveError;
   }
   if(oldPath&&oldPath!==info.path){
     try{
       await window.learningHubDb.deleteAsset(oldPath);
     }catch(cleanupError){
       console.warn('[Learning Hub] Previous asset cleanup failed.',cleanupError);
       alert('새 파일 연결은 저장됐지만 이전 파일 정리에 실패했습니다.\n파일 목록에서 이전 파일을 삭제할 수 있습니다.\n\n'+(cleanupError.message||cleanupError));
     }
   }
   if($('assetUploadStatus'))$('assetUploadStatus').textContent='업로드/교체 완료 · Supabase 저장 완료';
   await refreshAssetList(false);
 }catch(e){
   if($('assetUploadStatus'))$('assetUploadStatus').textContent='업로드 실패';
   alert('파일을 업로드하지 않았습니다.\n\n'+(e.message||e));
 }finally{
   if($('assetUploadBtn'))$('assetUploadBtn').disabled=false;
   if($('assetFile'))$('assetFile').value='';
 }
}
async function makeSafetyBackup(prefix){if(!window.learningHubDb)throw new Error('Supabase 연결 모듈을 찾을 수 없습니다.');const backup=await window.learningHubDb.createBackup();downloadBackupFile(backup,prefix);return backup}
async function deleteCurrentContent(){if(!selected)return;if(dirty)return alert('삭제 전에 현재 변경사항을 저장하세요.');const c=selected;const typed=prompt(`콘텐츠 ${c.id} · ${c.title}\n\n삭제하면 해당 콘텐츠와 Learning Hub Storage의 파일이 삭제됩니다.\n다른 콘텐츠의 이전/다음 연결에서 이 ID도 자동 해제됩니다.\nrevision 이력은 감사 기록으로 보존합니다.\n\n계속하려면 콘텐츠 ID를 정확히 입력하세요.`, '');if(typed!==c.id)return alert('ID가 일치하지 않아 삭제하지 않았습니다.');if(!confirm(`정말 ${c.id} 콘텐츠를 삭제하시겠습니까?\n\n삭제 직전 전체 백업 파일을 자동 저장합니다.`))return;try{await makeSafetyBackup('learning-hub-before-content-delete');setState('콘텐츠 삭제 중',false);const result=await window.learningHubDb.deleteContent(c.id);db=await window.learningHubDb.loadAll();selected=db.contents[0]||null;dirty=false;drawNav();selected?load(selected.id):empty();setState('Supabase 연결',true);toast(`콘텐츠 삭제 완료 · 연결 ${result.referencesUpdated}건 정리 · 파일 ${result.assetsDeleted}개 삭제`)}catch(e){operationalError('콘텐츠 삭제',e)}}
async function deleteCurrentTrack(){if(dirty)return alert('삭제 전에 현재 변경사항을 저장하세요.');const list=db.tracks.map(t=>`${t.num}: ${t.name} (${db.contents.filter(c=>c.track===t.num).length}개)`).join('\n');const code=(prompt(`삭제할 Track 번호를 입력하세요.\n\n콘텐츠가 0개인 Track만 삭제할 수 있습니다.\n\n${list}`,'')||'').trim();if(!code)return;const track=db.tracks.find(t=>t.num===code);if(!track)return alert('Track 번호를 확인하세요.');const count=db.contents.filter(c=>c.track===code).length;if(count>0)return alert(`Track ${code}에 콘텐츠 ${count}개가 있습니다.\n\n안전상 콘텐츠가 남아 있는 Track은 삭제하지 않습니다.`);const typed=prompt(`Track ${code} · ${track.name}\n\n삭제 직전 전체 백업을 자동 저장합니다.\n계속하려면 Track 번호를 다시 입력하세요.`,'');if(typed!==code)return alert('Track 번호가 일치하지 않아 삭제하지 않았습니다.');try{await makeSafetyBackup('learning-hub-before-track-delete');setState('Track 삭제 중',false);await window.learningHubDb.deleteTrack(code);db=await window.learningHubDb.loadAll();selected=db.contents[0]||null;dirty=false;drawNav();selected?load(selected.id):empty();setState('Supabase 연결',true);toast(`Track ${code} 삭제 완료`)}catch(e){operationalError('Track 삭제',e)}}

function downloadBackupFile(backup,prefix='learning-hub-backup'){
 const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),a=document.createElement('a');
 const stamp=new Date().toISOString().replace(/[:.]/g,'-');
 a.href=URL.createObjectURL(blob);
 a.download=`${prefix}-${stamp}.json`;
 a.click();
 setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
async function exportBackup(){
 try{
   if(!window.learningHubDb)throw new Error('Supabase 연결 모듈을 찾을 수 없습니다.');
   const backup=await window.learningHubDb.createBackup();
   downloadBackupFile(backup,'learning-hub-backup');
   toast('Supabase 백업 파일을 저장했습니다.');
 }catch(e){
   alert('백업하지 않았습니다.\n\n'+(e.message||e));
 }
}
async function importBackup(file){
 try{
   if(dirty)return alert('먼저 현재 변경사항을 저장하세요.');
   const text=await file.text();
   let backup;
   try{backup=JSON.parse(text)}catch(e){throw new Error('JSON 파일을 읽을 수 없습니다.')}
   if(!backup||backup.backupVersion!==1||!backup.tables||!Array.isArray(backup.tables.learning_tracks)||!Array.isArray(backup.tables.learning_contents)){
     throw new Error('호환되는 Learning Hub 백업 파일이 아닙니다.');
   }
   const tc=backup.tables.learning_tracks.length,cc=backup.tables.learning_contents.length;
   if(!confirm(`백업 시점의 Learning Hub 데이터로 복구하시겠습니까?\n\nTrack ${tc}개 · Content ${cc}개\n\n현재 백업에 없는 Track/Content는 삭제됩니다. 기존 revision 이력은 보존되고 복구 이력이 추가됩니다.`))return;
   if(!window.learningHubDb)throw new Error('Supabase 연결 모듈을 찾을 수 없습니다.');
   const safetyBackup=await window.learningHubDb.createBackup();
   downloadBackupFile(safetyBackup,'learning-hub-before-restore');
   const result=await window.learningHubDb.restoreBackup(backup);
   db=await window.learningHubDb.loadAll();
   selected=db.contents[0]||null;dirty=false;drawNav();selected?load(selected.id):empty();
   toast(`Supabase 복구 완료 · ${result.tracks} Tracks · ${result.contents} Contents`);
 }catch(e){
   alert('복구하지 않았습니다.\n\n'+(e.message||e));
 }
}
function toast(s){const t=$('toast');t.textContent=s;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function bind(){
 $('nav').onclick=e=>{if(e.target.dataset.id)load(e.target.dataset.id)};
 $('search').oninput=()=>drawNav($('search').value);
 if($('addTrackBtn'))$('addTrackBtn').onclick=addTrack;
 if($('addContentBtn'))$('addContentBtn').onclick=addContent;
 const tabs=document.querySelector('.tabs');
 if(tabs)tabs.onclick=e=>{if(!e.target.dataset.tab)return;document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));e.target.classList.add('active');document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===e.target.dataset.tab))};
 if($('addLink'))$('addLink').onclick=()=>{addLinkRow();markDirty()};
 if($('addBlockBtn'))$('addBlockBtn').onclick=()=>{addBlockRow({section:'learn',type:'TEXT'});markDirty()};
 if($('assetUploadBtn'))$('assetUploadBtn').onclick=e=>{e.preventDefault();if($('assetFile'))$('assetFile').click()};
 if($('assetRefreshBtn'))$('assetRefreshBtn').onclick=e=>{e.preventDefault();refreshAssetList(true)};
 if($('assetFile'))$('assetFile').onchange=e=>{if(e.target.files[0])uploadAssetFile(e.target.files[0])};
 if($('saveBtn'))$('saveBtn').onclick=e=>{e.preventDefault();save()};
 if($('previewBtn'))$('previewBtn').onclick=e=>{e.preventDefault();if(dirty)return alert('미리보기 전에 현재 변경사항을 저장하세요.');if(selected)window.open(`../lesson.html?id=${selected.id}`,'_blank')};
 if($('backupBtn'))$('backupBtn').onclick=exportBackup;
 if($('restoreBtn'))$('restoreBtn').onclick=e=>{e.preventDefault();if($('restoreFile'))$('restoreFile').click()};
 if($('restoreFile'))$('restoreFile').onchange=e=>{if(e.target.files[0])importBackup(e.target.files[0]);e.target.value=''};
 if($('deleteContentBtn'))$('deleteContentBtn').onclick=e=>{e.preventDefault();deleteCurrentContent()};
 if($('deleteTrackBtn'))$('deleteTrackBtn').onclick=e=>{e.preventDefault();deleteCurrentTrack()};
 if($('exportBtn'))$('exportBtn').onclick=exportBackup;
 if($('importFile'))$('importFile').onchange=e=>{if(e.target.files[0])importBackup(e.target.files[0]);e.target.value=''};
 document.querySelectorAll('#form input:not(:disabled):not([type="file"]),#form textarea,#form select').forEach(e=>e.addEventListener('input',markDirty));
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}})
}
boot()})();