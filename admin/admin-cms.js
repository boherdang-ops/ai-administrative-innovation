(function(){
 const DRAFT='labPortfolioCMSDraft',PUB='labPortfolioCMSPublished',KEY='labPortfolioCMS',DT='labPortfolioUniversalDraft',PT='labPortfolioUniversalPublished',DI='labPortfolioImagesDraft',PI='labPortfolioImagesPublished',H='labPortfolioCMSHistory';
 const get=(k,d={})=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(e){return d}};
 const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
 const now=()=>new Date().toLocaleString('ko-KR');
 function snapshot(){return {data:get(KEY,{}),text:get('labPortfolioUniversal',{}),images:get('labPortfolioImages',{})}}
 function saveDraft(){
   const data=localStorage.getItem(KEY)||JSON.stringify(get(PUB,get(DRAFT,{})));
   localStorage.setItem(DRAFT,data);
   localStorage.setItem(DT,localStorage.getItem(DT)||localStorage.getItem('labPortfolioUniversal')||'{}');
   localStorage.setItem(DI,localStorage.getItem(DI)||localStorage.getItem('labPortfolioImages')||'{}');
   document.getElementById('status').textContent='임시저장됨 · '+now();
   renderWorkflow();
 }
 function preview(){window.open('../?preview=1','_blank')}
 function publish(){
   if(!confirm('현재 임시저장된 내용을 공개 상태로 반영할까요?'))return;
   saveDraft();
   const d=get(DRAFT,{}),t=get(DT,{}),i=get(DI,{}),before=get(PUB,{});
   const hist=get(H,[]);
   hist.unshift({id:Date.now(),at:new Date().toISOString(),data:d,text:t,images:i,summary:diffSummary(before,d,get(PT,{}),t)});
   set(H,hist.slice(0,20));
   set(PUB,d);set(KEY,d);set(PT,t);set('labPortfolioUniversal',t);set(PI,i);set('labPortfolioImages',i);
   document.getElementById('status').textContent='공개 완료 · '+now();
   renderWorkflow();
 }
 function diffSummary(oldD,newD,oldT,newT){
   const count=(a,b)=>{const A=JSON.stringify(a||{}),B=JSON.stringify(b||{});return A===B?0:1};
   const fields=['profile','metrics','courses','records','assets','kaim','diagnosis','book','channels','contact'];
   const changed=fields.filter(k=>JSON.stringify(oldD?.[k])!==JSON.stringify(newD?.[k])).length;
   const textChanged=Object.keys(newT||{}).filter(k=>(newT[k]??'')!==(oldT?.[k]??'')).length;
   const imageChanged=Object.keys(newD?.assets||{}).length?Object.keys(newD?.assets||{}).filter(k=>false).length:0;
   return {sections:changed,text:textChanged,images:imageChanged};
 }
 function flatten(obj,p='',out={}){if(obj&&typeof obj==='object'&&!Array.isArray(obj)){Object.entries(obj).forEach(([k,v])=>flatten(v,p?p+'.'+k:k,out));}else out[p]=obj??'';return out}
 function diffRows(a,b,label){
   const A=flatten(a),B=flatten(b),keys=[...new Set([...Object.keys(A),...Object.keys(B)])];
   return keys.filter(k=>JSON.stringify(A[k])!==JSON.stringify(B[k])).map(k=>({key:k,old:A[k]??'',next:B[k]??''}));
 }
 function openHistory(){
   const h=get(H,[]); let box=document.getElementById('historyBox');
   if(!box){box=document.createElement('div');box.id='historyBox';box.className='history-box';document.querySelector('.actions').after(box)}
   if(!h.length){box.innerHTML='<b>변경 이력</b><p class="small-muted">아직 공개 이력이 없습니다.</p>';return}
   box.innerHTML='<div class="history-head"><div><b>변경 이력</b><span class="small-muted">최근 20개 · 공개 당시의 전체 상태를 보관합니다.</span></div><button type="button" id="closeHistory">닫기</button></div><div class="history-list">'+h.map((x,n)=>`<div class="history-item"><div><strong>${n+1}. ${new Date(x.at).toLocaleString('ko-KR')}</strong><div class="small-muted">섹션 변경 ${x.summary?.sections||0} · 문구 ${x.summary?.text||0}개</div></div><div class="history-buttons"><button data-history-diff="${x.id}">비교</button><button data-history-restore="${x.id}" class="restore">이 버전 복구</button></div></div>`).join('')+'</div><div id="historyCompare"></div>';
   document.getElementById('closeHistory').onclick=()=>box.remove();
   box.querySelectorAll('[data-history-diff]').forEach(b=>b.onclick=()=>compareHistory(Number(b.dataset.historyDiff)));
   box.querySelectorAll('[data-history-restore]').forEach(b=>b.onclick=()=>restoreHistory(Number(b.dataset.historyRestore)));
 }
 function compareHistory(id){
   const item=get(H,[]).find(x=>x.id===id);if(!item)return;
   const current=snapshot(), rows=diffRows(item.data,current.data,'data'), texts=diffRows(item.text,current.text,'text');
   const target=document.getElementById('historyCompare');if(!target)return;
   const all=[...rows,...texts.map(x=>({...x,key:'전체문구 · '+x.key}))];
   target.innerHTML='<div class="compare-box"><div class="compare-head"><b>버전 비교</b><span class="small-muted">선택 버전 ↔ 현재 작업본</span></div>'+(all.length?'<div class="diff-table"><div class="diff-row diff-title"><span>항목</span><span>선택 버전</span><span>현재 작업본</span></div>'+all.slice(0,200).map(x=>`<div class="diff-row"><span>${esc(x.key)}</span><span>${esc(display(x.old))}</span><span>${esc(display(x.next))}</span></div>`).join('')+'</div><p class="small-muted">차이가 ${all.length}개 있습니다. 최대 200개까지 표시합니다.</p>':'<p class="small-muted">차이가 없습니다.</p>')+'</div>';
 }
 function display(v){return typeof v==='string'?v:JSON.stringify(v)}
 function restoreHistory(id){
   const item=get(H,[]).find(x=>x.id===id);if(!item)return;
   if(!confirm('선택한 공개 버전을 현재 작업본으로 복구할까요? 즉시 공개되지는 않으며, 복구 후 미리보기와 임시저장을 거쳐 공개할 수 있습니다.'))return;
   set(DRAFT,item.data);set(KEY,item.data);set(DT,item.text||{});set('labPortfolioUniversal',item.text||{});set(DI,item.images||{});set('labPortfolioImages',item.images||{});
   data=JSON.parse(JSON.stringify(item.data));
   document.getElementById('status').textContent='이전 버전 복구됨 · '+now();
   renderWorkflow(); panel();
 }
 function renderWorkflow(){
   let el=document.getElementById('workflowStatus'); if(!el){el=document.createElement('div');el.id='workflowStatus';el.className='workflow-status';document.querySelector('.actions').before(el)}
   const draft=localStorage.getItem(DRAFT),pub=localStorage.getItem(PUB);const changed=draft&&pub&&draft!==pub;
   el.innerHTML=`<div><b>콘텐츠 상태</b><span class="state ${changed?'draft':'published'}">${changed?'임시 수정본 있음':'공개본과 동일'}</span></div><div class="workflow-meta">${draft?'임시저장본 존재':'임시저장본 없음'} · ${pub?'공개본 존재':'공개본 없음'}</div>`;
 }
 function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
 document.getElementById('saveDraft').onclick=saveDraft;
 document.getElementById('previewSite').onclick=preview;
 document.getElementById('publishSite').onclick=publish;
 document.getElementById('historySite').onclick=openHistory;
 renderWorkflow();
})();
