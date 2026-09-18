(function(){
 let client=null,session=null;
 const cfg=()=>window.CMS_CLOUD?.config?.()||{url:'',anonKey:''};
 const status=t=>{const e=document.getElementById('cloudStatus');if(e)e.textContent=t; const s=document.getElementById('status');if(s)s.textContent=t};
 async function init(){const c=cfg();if(!c.url||!c.anonKey){status('클라우드 설정 없음 · 현재 로컬 모드');return false}if(!window.supabase){status('Supabase 라이브러리 로드 대기 중');return false}client=window.supabase.createClient(c.url,c.anonKey);const r=await client.auth.getSession();session=r.data.session;window.CMS_CLOUD?.setToken(session?.access_token||'');status(session?'로그인됨: '+(session.user.email||'관리자'):'로그인 필요');return true}
 async function login(){if(!await init())return;const email=document.getElementById('cloudEmail').value.trim(),password=document.getElementById('cloudPassword').value;if(!email||!password){status('이메일과 비밀번호를 입력하세요.');return}const r=await client.auth.signInWithPassword({email,password});if(r.error){status('로그인 실패: '+r.error.message);return}session=r.data.session;window.CMS_CLOUD?.setToken(session?.access_token||'');document.getElementById('cloudPassword').value='';status('로그인됨: '+email);}
 async function logout(){if(client)await client.auth.signOut();session=null;window.CMS_CLOUD?.setToken('');status('로그아웃됨');}
 function saveConfig(){const c={url:document.querySelector('[data-k="cloud.url"]').value.trim().replace(/\/$/,''),anonKey:document.querySelector('[data-k="cloud.anonKey"]').value.trim()};window.CMS_CLOUD.saveConfig(c);status(c.url?'설정 저장됨. 로그인하세요.':'로컬 모드');init();}
 function localPayload(){return {data:JSON.parse(localStorage.getItem('labPortfolioCMS')||'{}'),text:JSON.parse(localStorage.getItem('labPortfolioUniversal')||'{}'),images:JSON.parse(localStorage.getItem('labPortfolioImages')||'{}')}}
 function summary(){return {generated_at:new Date().toISOString(),note:'Direct Publish (v12)'}}

 async function pull(){if(!window.CMS_CLOUD?.ready()){status('클라우드 설정을 먼저 저장하세요.');return}try{const row=await window.CMS_CLOUD.getState(session?.access_token);if(!row){status('공개 데이터가 없습니다.');return}if(row.published_data){localStorage.setItem('labPortfolioCMSPublished',JSON.stringify(row.published_data));localStorage.setItem('labPortfolioCMS',JSON.stringify(row.published_data));}if(row.published_text){localStorage.setItem('labPortfolioUniversalPublished',JSON.stringify(row.published_text));localStorage.setItem('labPortfolioUniversal',JSON.stringify(row.published_text))}if(row.published_images){localStorage.setItem('labPortfolioImagesPublished',JSON.stringify(row.published_images));localStorage.setItem('labPortfolioImages',JSON.stringify(row.published_images))}location.reload()}catch(e){status('불러오기 실패: '+e.message)}}

 async function cloudPublish(silent=false){
   if(!session) return;
   try{
     const p=localPayload();
     await window.CMS_CLOUD.publishState(p,summary(),session.access_token,session.user.id);
     if(!silent) status('클라우드 자동 동기화 완료 · '+new Date().toLocaleTimeString('ko-KR'));
   }catch(e){
     status('⚠ 클라우드 동기화 실패: '+e.message+' (로컬에는 반영됨)');
   }
 }

 async function showRevisions(){const box=document.getElementById('cloudHistoryBox');if(!box)return;if(!session){box.innerHTML='<p class="small-muted">관리자 로그인 후 서버 백업을 확인할 수 있습니다.</p>';return}try{const rows=await window.CMS_CLOUD.revisions(session.access_token);box.innerHTML='<div class="history-head"><div><b>서버 백업 이력</b></div><button type="button" id="closeCloudHistory">닫기</button></div>'+(rows.length?rows.map((r,i)=>`<div class="history-item"><div><strong>${i+1}. ${new Date(r.published_at).toLocaleString('ko-KR')}</strong></div><div class="history-buttons"><button data-cloud-restore="${r.id}" class="restore">이 버전 복구</button></div></div>`).join(''):'<p class="small-muted">이력이 없습니다.</p>');document.getElementById('closeCloudHistory').onclick=()=>box.innerHTML='';box.querySelectorAll('[data-cloud-restore]').forEach(b=>b.onclick=()=>restore(Number(b.dataset.cloudRestore)));}catch(e){box.innerHTML='<p class="small-muted">조회 실패: '+esc(e.message)+'</p>'}}
 async function restore(id){if(!confirm('선택한 서버 버전을 현재 작업본으로 복구할까요? 복구 후 직접 저장해야 홈페이지에 반영됩니다.'))return;try{await window.CMS_CLOUD.restoreRevision(id,session.access_token);await pull();}catch(e){status('복구 실패: '+e.message)}}
 function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

 /* v12 : 패널 DOM은 탭을 열 때마다 새로 생성되므로 요소 단위로 멱등 바인딩한다.
    (기존 initialized 플래그 방식은 최초 호출 시 클라우드 버튼이 없어 영구 미바인딩) */
 let inited=false;
 const on=(id,fn)=>{const el=document.getElementById(id);if(el&&!el.dataset.cloudBound){el.dataset.cloudBound='1';el.addEventListener('click',fn)}};
 window.CMS_ADMIN_CLOUD={
   get session(){return session;},
   cloudPublish,
   showRevisions,
   bind(){
     on('saveCloudConfig',saveConfig);
     on('cloudLogin',login);
     on('cloudLogout',logout);
     on('cloudPull',pull);
     on('cloudPush',()=>cloudPublish(false));
     on('cloudHistory',showRevisions);
     if(!inited){inited=true;init()}
     if(!document.getElementById('cloudHistoryBox')){const x=document.createElement('div');x.id='cloudHistoryBox';x.className='history-box';document.querySelector('.actions')?.after(x)}
   }
 };
})();
