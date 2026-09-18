(function(){
 const PUB='labPortfolioCMSPublished',KEY='labPortfolioCMS',PT='labPortfolioUniversalPublished',PI='labPortfolioImagesPublished',H='labPortfolioCMSHistory';
 const get=(k,d={})=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(e){return d}};
 const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
 const now=()=>new Date().toLocaleString('ko-KR');

 function publish(){
   const d=get(KEY,{}),t=get('labPortfolioUniversal',{}),i=get('labPortfolioImages',{}),before=get(PUB,{});
   const hist=get(H,[]);
   hist.unshift({id:Date.now(),at:new Date().toISOString(),data:d,text:t,images:i});
   set(H,hist.slice(0,20));
   set(PUB,d);set(PT,t);set(PI,i);
   document.getElementById('status').textContent='홈페이지에 즉시 반영됨 · '+now();

   // 로그인 상태인 경우 클라우드 자동 동기화
   if(window.CMS_ADMIN_CLOUD?.session && window.CMS_ADMIN_CLOUD?.cloudPublish){
       window.CMS_ADMIN_CLOUD.cloudPublish(true);
   }
 }

 // 기존 저장 버튼을 누르면 내부 데이터 갱신 후 즉시 퍼블리시 실행
 const originalSave = document.getElementById('save').onclick;
 document.getElementById('save').onclick = (e) => {
     if(originalSave) originalSave(e);
     publish();
 };

 document.getElementById('previewSite').onclick=()=>window.open('../','_blank');

 // 롤백이 필요할 때를 대비한 백업 이력 관리 기능
 function openHistory(){
   const h=get(H,[]); let box=document.getElementById('historyBox');
   if(!box){box=document.createElement('div');box.id='historyBox';box.className='history-box';document.querySelector('.actions').after(box)}
   if(!h.length){box.innerHTML='<b>백업 이력</b><p class="small-muted">아직 저장 이력이 없습니다.</p>';return}
   box.innerHTML='<div class="history-head"><div><b>백업 이력</b><span class="small-muted">최근 20개 · 저장 당시의 상태를 안전하게 보관합니다.</span></div><button type="button" id="closeHistory">닫기</button></div><div class="history-list">'+h.map((x,n)=>`<div class="history-item"><div><strong>${n+1}. ${new Date(x.at).toLocaleString('ko-KR')}</strong></div><div class="history-buttons"><button data-history-restore="${x.id}" class="restore">이 버전 복구</button></div></div>`).join('')+'</div>';
   document.getElementById('closeHistory').onclick=()=>box.remove();
   box.querySelectorAll('[data-history-restore]').forEach(b=>b.onclick=()=>restoreHistory(Number(b.dataset.historyRestore)));
 }
 function restoreHistory(id){
   const item=get(H,[]).find(x=>x.id===id);if(!item)return;
   if(!confirm('선택한 버전을 현재 작업본으로 복구할까요? 복구 후 [저장]을 눌러야 홈페이지에 반영됩니다.'))return;
   set(KEY,item.data);set('labPortfolioUniversal',item.text||{});set('labPortfolioImages',item.images||{});
   document.getElementById('status').textContent='이전 버전 복구됨 · '+now();
   location.reload();
 }
 document.getElementById('historySite').onclick=openHistory;
})();
