const KEY='labPortfolioCMS';
const defaults={profile:{name:'박상득',anchor:'한국형 지자체 AI 행정 5단계 모형 개발',title:'교육과정 및 행정지원 앱 개발 · AI교육',claim:'설계한 사람이 직접 진행합니다.',career:['현) 한국공공자치연구원 AI행정혁신연구소장','전) 한국공공자치연구원 연구기획본부장','전) 국가안보전략연구원 선임연구원','전) 한국능률협회 국제사업본부 일본지역 팀장'],portrait:''},metrics:{institutions:'○○',hours:'○○○',learners:'○,○○○'},assets:[{title:'교육과정',desc:'2시간부터 49시간까지, 최고위부터 실무자까지',image:''},{title:'교육생용 교재',desc:'직접 집필·인쇄·배포, 저작권 등록 진행',image:''},{title:'실습용 웹 응용프로그램',desc:'과정별 전용, 교육 중 실제 사용',image:''},{title:'진단 모형',desc:'한국형 지자체 AI 행정 5단계 모형(KAIM)',image:''}],records:[],courses:[{name:'최고위 정책 워크숍',target:'단체장·간부',hours:'2H',content:'AI가 하지 못하는 것과 부서에 줄 기준'},{name:'AI 활용 역량강화',target:'전 직원',hours:'7H',content:'업무를 지시 가능한 형태로 분해하는 방법'},{name:'직무 심화',target:'실무자',hours:'14H',content:'문서·데이터·민원 업무의 AI 적용과 검증'},{name:'제로빌드 정책기획',target:'기획 부서',hours:'14H',content:'기 확보 자원을 재배열하는 정책 재설계'},{name:'문제해결형 혁신리더',target:'핵심 인력',hours:'49H',content:'6회차 과제 수행형 리더 양성'}],kaim:['개인 활용','전원 활용','업무 표준','조직 자산','정책 활용'],diagnosis:{url:'',duration:'20분',cost:'무상',button:'예비진단 시작하기'},book:{title:'출근길 3분 AI',intro:'',publisher:'',year:'',image:''},channels:{youtube:'',blog:'',library:'/library/'},contact:{phone:'010-9145-1318',email:'ai.happybrain@gmail.com',site:'https://happybrain.ai.kr'}};
let data=load(), current='dashboard';
function clone(x){return JSON.parse(JSON.stringify(x))}
function load(){try{const s=localStorage.getItem(KEY);return s?JSON.parse(s):clone(defaults)}catch(e){return clone(defaults)}}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function input(path,value,placeholder=''){return `<input data-k="${esc(path)}" value="${esc(value)}" placeholder="${esc(placeholder)}">`}
function area(path,value,placeholder=''){return `<textarea data-k="${esc(path)}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`}
function setPath(path,v){const parts=path.split('.');let o=data;for(let i=0;i<parts.length-1;i++)o=o[parts[i]];o[parts.at(-1)]=v}
function getRowsConfig(){return {courses:{title:'교육과정',fields:[['name','과정명'],['target','대상'],['hours','시간'],['content','핵심 내용']]},assets:{title:'포트폴리오',fields:[['title','제목'],['desc','설명'],['image','이미지 경로']]},records:{title:'교육실적',fields:[['org','기관명'],['course','과정명'],['period','실시 시기'],['hours','교육시간'],['learners','수강인원']]}}[current]}
function rowTemplate(index,fields,obj={}){return `<div class="row" data-i="${index}">${fields.map(([k,label])=>`<div class="field"><label>${label}</label>${input(k,obj[k]||'')}</div>`).join('')}<button type="button" class="del" data-i="${index}">삭제</button></div>`}
function list(title,arr,fields){return `<div class="card"><div class="card-head"><div><h2>${title}</h2><p class="hint">필요한 만큼 추가하고 저장하세요.</p></div><button type="button" class="add" id="add">+ 추가</button></div><div id="list">${arr.map((o,i)=>rowTemplate(i,fields,o)).join('')}</div></div>`}
function dashboard(){
 const draft=localStorage.getItem('labPortfolioCMSDraft');
 const pub=localStorage.getItem('labPortfolioCMSPublished');
 const history=(()=>{try{return JSON.parse(localStorage.getItem('labPortfolioCMSHistory')||'[]')}catch(e){return []}})();
 const hasCloud=!!window.CMS_CLOUD?.ready?.();
 const universal=(()=>{try{return Object.keys(JSON.parse(localStorage.getItem('labPortfolioUniversal')||'{}')).length}catch(e){return 0}})();
 const media=(()=>{try{return Object.keys(JSON.parse(localStorage.getItem('labPortfolioImages')||'{}')).length}catch(e){return 0}})();
 const last=history[0]?.at;
 const records=Array.isArray(data.records)?data.records.length:0, courses=Array.isArray(data.courses)?data.courses.length:0, assets=Array.isArray(data.assets)?data.assets.length:0;
 return `<div class="dashboard-grid">
   <div class="dash-card dash-wide"><div class="dash-label">홈페이지 운영 상태</div><div class="dash-title">${pub?'공개본이 있습니다':'아직 공개 이력이 없습니다'}</div><div class="dash-meta">${last?'마지막 공개: '+new Date(last).toLocaleString('ko-KR'):'임시저장과 공개를 시작하세요.'}</div><div class="dash-actions"><a href="../?edit=1" target="_blank">직접 편집</a><a href="../?preview=1" target="_blank">미리보기</a></div></div>
   <div class="dash-card"><div class="dash-label">콘텐츠</div><div class="dash-number">${courses}</div><div class="dash-meta">교육과정</div><button data-go="courses">관리하기 →</button></div>
   <div class="dash-card"><div class="dash-label">실적</div><div class="dash-number">${records}</div><div class="dash-meta">교육실적</div><button data-go="records">관리하기 →</button></div>
   <div class="dash-card"><div class="dash-label">포트폴리오</div><div class="dash-number">${assets}</div><div class="dash-meta">포트폴리오 항목</div><button data-go="assets">관리하기 →</button></div>
   <div class="dash-card"><div class="dash-label">전체 문구</div><div class="dash-number">${universal}</div><div class="dash-meta">직접 수정된 문구</div><button data-go="alltext">편집하기 →</button></div>
   <div class="dash-card"><div class="dash-label">이미지</div><div class="dash-number">${media}</div><div class="dash-meta">등록된 이미지 정보</div><button data-go="media">자료실 →</button></div>
   <div class="dash-card"><div class="dash-label">클라우드</div><div class="dash-status"><i class="dot ${hasCloud?'on':'off'}"></i>${hasCloud?'연결 설정됨':'로컬 모드'}</div><div class="dash-meta">Supabase 연결 상태</div><button data-go="cloud">설정하기 →</button></div>
   <div class="dash-card dash-wide"><div class="dash-label">최근 작업</div><div class="recent-list">${history.slice(0,5).map((x,i)=>`<div><span>${i+1}</span><b>${new Date(x.at).toLocaleString('ko-KR')}</b><small>공개본 백업</small></div>`).join('')||'<div class="empty">최근 공개 기록이 없습니다.</div>'}</div></div>
   <div class="dash-card dash-wide"><div class="dash-label">빠른 작업</div><div class="quick-grid"><button data-go="profile">프로필 수정</button><button data-go="metrics">실적 수치</button><button data-go="alltext">홈페이지 전체 편집</button><button data-go="media">이미지 자료실</button><button id="dashDraft">임시저장</button><button id="dashPublish" class="publish">공개</button></div></div>
 </div>`;
}

function panel(){
 const p=document.getElementById('panel');let h='';
 if(current==='dashboard')h=dashboard();
 else if(current==='profile')h=`<div class="card"><h2>프로필</h2><div class="grid"><div><label>이름</label>${input('profile.name',data.profile.name)}</div><div><label>대표 문구</label>${input('profile.anchor',data.profile.anchor)}</div></div><label>직함/소개</label>${input('profile.title',data.profile.title)}<label>대표 문장</label>${input('profile.claim',data.profile.claim)}<label>경력 — 한 줄에 하나</label>${area('profile.career',data.profile.career.join('\n'))}<label>인물 사진 경로</label>${input('profile.portrait',data.profile.portrait,'예: images/profile.jpg')}</div>`;
 else if(current==='metrics')h=`<div class="card"><h2>실적 수치</h2><p class="hint">첫 화면과 교육실적 영역에 표시되는 공개 수치입니다.</p><div class="grid"><div><label>실시 기관</label>${input('metrics.institutions',data.metrics.institutions)}</div><div><label>누적 교육시간</label>${input('metrics.hours',data.metrics.hours)}</div><div><label>누적 수강인원</label>${input('metrics.learners',data.metrics.learners)}</div></div></div>`;
 else if(['courses','assets','records'].includes(current)){const c=getRowsConfig();h=list(c.title,data[current],c.fields)}
 else if(current==='kaim')h=`<div class="card"><h2>KAIM 5단계</h2><p class="hint">단계명만 관리합니다. 설명문은 현재 원문 구조를 유지합니다.</p>${data.kaim.map((v,i)=>`<label>제${i+1}단계</label>${input('kaim.'+i,v)}`).join('')}</div>`;
 else if(current==='diagnosis')h=`<div class="card"><h2>AI 행정 예비진단</h2><label>서비스 URL</label>${input('diagnosis.url',data.diagnosis.url,'예: /diagnosis/ 또는 https://...')}<div class="grid"><div><label>소요시간</label>${input('diagnosis.duration',data.diagnosis.duration)}</div><div><label>비용</label>${input('diagnosis.cost',data.diagnosis.cost)}</div></div><label>버튼 문구</label>${input('diagnosis.button',data.diagnosis.button)}</div>`;
 else if(current==='book')h=`<div class="card"><h2>도서</h2><label>도서명</label>${input('book.title',data.book.title)}<label>한 줄 소개</label>${input('book.intro',data.book.intro)}<div class="grid"><div><label>출판사</label>${input('book.publisher',data.book.publisher)}</div><div><label>발행연도</label>${input('book.year',data.book.year)}</div></div><label>표지 이미지 경로</label>${input('book.image',data.book.image,'예: images/book-cover.jpg')}</div>`;
 else if(current==='media')h=`<div class="card"><div class="card-head"><div><h2>이미지 자료실</h2><p class="hint">관리자 로그인 후 이미지를 Supabase Storage에 업로드하고, 홈페이지에서 사용할 수 있는 주소를 복사합니다.</p></div></div><div class="media-upload"><input id="mediaFile" type="file" accept="image/*"><button type="button" id="uploadMedia" class="primary">이미지 업로드</button></div><p id="mediaStatus" class="hint">이미지 목록을 불러오는 중…</p><div id="mediaGrid" class="media-grid"></div></div>`
 else if(current==='cloud')h=`<div class="card"><h2>클라우드 CMS 운영</h2><p class="hint">Supabase를 연결하면 콘텐츠를 여러 기기에서 공유할 수 있습니다. 연결하지 않으면 기존 LocalStorage 방식으로 동작합니다.</p><label>Supabase Project URL</label>${input('cloud.url',window.CMS_CLOUD?.config?.().url||'','https://xxxx.supabase.co')}<label>Supabase anon public key</label>${input('cloud.anonKey',window.CMS_CLOUD?.config?.().anonKey||'','anon public key')}<div class="cloud-actions"><button type="button" id="saveCloudConfig">연결 설정 저장</button></div><hr><h3>관리자 로그인</h3><div class="grid"><div><label>이메일</label><input id="cloudEmail" type="email" placeholder="관리자 이메일"></div><div><label>비밀번호</label><input id="cloudPassword" type="password" placeholder="Supabase Auth 비밀번호"></div></div><div class="cloud-actions"><button type="button" id="cloudLogin">로그인</button><button type="button" id="cloudLogout">로그아웃</button></div><hr><h3>콘텐츠 동기화</h3><div class="cloud-actions"><button type="button" id="cloudPull">공개본 불러오기</button><button type="button" id="cloudPush" class="publish">현재 콘텐츠를 클라우드에 공개</button></div><p id="cloudStatus" class="hint">상태 확인 중…</p><div class="cloud-note"><b>주의</b><br>service_role 키는 입력하지 마세요. anon public key만 사용하세요.</div></div>`
 
 else if(current==='channels')h=`<div class="card"><h2>채널 / 문의</h2><label>YouTube 주소</label>${input('channels.youtube',data.channels.youtube,'https://...')}<label>블로그 주소</label>${input('channels.blog',data.channels.blog,'https://...')}<label>자료실 주소</label>${input('channels.library',data.channels.library,'/library/')}<div class="grid"><div><label>전화</label>${input('contact.phone',data.contact.phone)}</div><div><label>이메일</label>${input('contact.email',data.contact.email)}</div></div><label>대표 사이트 주소</label>${input('contact.site',data.contact.site)}</div>`;
 else if(current==='alltext')h=`<div class="card alltext-card"><div class="card-head"><div><h2>홈페이지 전체 문구 편집</h2><p class="hint">화면에 실제 표시되는 모든 글자와 숫자를 한 화면에서 수정합니다. 저장하면 홈페이지에 즉시 반영됩니다.</p></div><button type="button" class="add" id="refreshText">화면 다시 읽기</button></div><div class="editor-tools"><input id="filterText" placeholder="검색: 예) 교육, AI, 49H, 박상득"><span id="textCount"></span></div><div id="allTextList"><div class="loading">홈페이지 화면을 읽는 중입니다…</div></div><div class="alltext-actions"><button type="button" class="primary" id="saveAllText">전체 문구 저장</button><button type="button" class="danger" id="clearAllText">전체 문구 수정내용 초기화</button></div></div>`;
 p.innerHTML=h;bindPanel();
}
let allTextItems=[];
function loadAllTextEditor(){
 const list=document.getElementById('allTextList'); if(!list)return;
 const frame=document.getElementById('universalFrame');
 const read=()=>{
   try{
     if(frame?.contentWindow?.CMS_UNIVERSAL){
       allTextItems=frame.contentWindow.CMS_UNIVERSAL.getItems(); renderAllText(); return;
     }
   }catch(e){}
   list.innerHTML='<div class="loading error">홈페이지 화면에 접근하지 못했습니다. 아래 미리보기 링크를 먼저 열어 같은 주소에서 관리자 페이지를 실행해 주세요.</div>';
 };
 if(!frame){
   const f=document.createElement('iframe'); f.id='universalFrame'; f.src='../?editorPreview=1'; f.setAttribute('aria-hidden','true'); f.style.cssText='position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;border:0'; document.body.appendChild(f);
   f.addEventListener('load',()=>setTimeout(read,700));
 } else {setTimeout(read,300)}
 const refresh=document.getElementById('refreshText'); if(refresh)refresh.onclick=()=>loadAllTextEditor();
 const filter=document.getElementById('filterText'); if(filter)filter.oninput=renderAllText;
 const saveBtn=document.getElementById('saveAllText'); if(saveBtn)saveBtn.onclick=saveAllText;
 const clearBtn=document.getElementById('clearAllText'); if(clearBtn)clearBtn.onclick=clearAllText;
}
function renderAllText(){
 const list=document.getElementById('allTextList'); if(!list)return;
 const q=(document.getElementById('filterText')?.value||'').trim().toLowerCase();
 const visible=allTextItems.filter(x=>(x.value||'').toLowerCase().includes(q)||(x.parentText||'').toLowerCase().includes(q));
 const count=document.getElementById('textCount'); if(count)count.textContent=`전체 ${allTextItems.length}개 · 표시 ${visible.length}개`;
 list.innerHTML=visible.map(x=>`<div class="text-row" data-key="${esc(x.key)}"><div class="text-meta"><span class="num">${x.index}</span><span class="tag">${esc(x.element)}</span><span class="context">${esc(x.parentText||'')}</span></div><textarea data-text-key="${esc(x.key)}">${esc(x.value)}</textarea></div>`).join('') || '<div class="loading">검색 결과가 없습니다.</div>';
}
function saveAllText(){
 const frame=document.getElementById('universalFrame'); if(!frame?.contentWindow?.CMS_UNIVERSAL){alert('홈페이지 편집 연결이 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.');return}
 const map=new Map(allTextItems.map(x=>[x.key,x])); document.querySelectorAll('[data-text-key]').forEach(el=>{const x=map.get(el.dataset.textKey);if(x)x.value=el.value});
 try{frame.contentWindow.CMS_UNIVERSAL.save(allTextItems);localStorage.setItem('labPortfolioUniversal',JSON.stringify(Object.fromEntries(allTextItems.map(x=>[x.key,x.value]))));document.getElementById('status').textContent='전체 문구 저장됨 · '+new Date().toLocaleTimeString('ko-KR');setTimeout(()=>frame.contentWindow.location.reload(),100)}catch(e){alert('저장에 실패했습니다. 홈페이지와 관리자 페이지가 같은 사이트에서 열려 있는지 확인해 주세요.')}
}
function clearAllText(){if(!confirm('전체 문구에서 직접 수정한 내용을 모두 초기화할까요? 기존 프로필·교육과정 데이터는 삭제하지 않습니다.'))return;localStorage.removeItem('labPortfolioUniversal');const frame=document.getElementById('universalFrame');try{frame.contentWindow.CMS_UNIVERSAL.clear()}catch(e){}setTimeout(loadAllTextEditor,500)}


async function loadMedia(){
 const grid=document.getElementById('mediaGrid'),statusEl=document.getElementById('mediaStatus'); if(!grid)return;
 try{
   if(!window.CMS_CLOUD?.ready()){statusEl.textContent='Supabase 연결 설정이 필요합니다.';return}
   const items=await window.CMS_CLOUD.listImages();
   grid.innerHTML=items.length?items.map(x=>`<div class="media-item"><img src="${esc(x.url)}" alt=""><div class="media-name">${esc(x.name)}</div><input value="${esc(x.url)}" readonly><button type="button" class="copy-url" data-url="${esc(x.url)}">주소 복사</button></div>`).join(''):'<div class="loading">업로드된 이미지가 없습니다.</div>';
   grid.querySelectorAll('.copy-url').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.url);b.textContent='복사됨'}catch(e){alert(b.dataset.url)}});
 }catch(e){statusEl.textContent='이미지 목록을 불러오지 못했습니다: '+e.message}
 const upload=document.getElementById('uploadMedia'); if(upload)upload.onclick=async()=>{
   const f=document.getElementById('mediaFile')?.files?.[0]; if(!f){alert('업로드할 이미지를 선택하세요.');return}
   upload.disabled=true;statusEl.textContent='업로드 중…';
   try{const x=await window.CMS_CLOUD.uploadImage(f);statusEl.textContent='업로드 완료: '+x.name;await loadMedia()}catch(e){statusEl.textContent='업로드 실패: '+e.message}finally{upload.disabled=false}
 };
}

function bindPanel(){
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{collect();current=b.dataset.go;document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x.dataset.tab===current));panel()});
 document.getElementById('dashDraft')?.addEventListener('click',()=>document.getElementById('saveDraft')?.click());
 document.getElementById('dashPublish')?.addEventListener('click',()=>document.getElementById('publishSite')?.click());
 document.querySelectorAll('[data-k]').forEach(e=>e.addEventListener('input',()=>setPath(e.dataset.k,e.value)));
 const add=document.getElementById('add');if(add)add.onclick=()=>{const cfg=getRowsConfig();data[current].push(Object.fromEntries(cfg.fields.map(([k])=>[k,''])));panel();setTimeout(()=>document.querySelector(`#list .row:last-child input`)?.focus(),0)};
 document.querySelectorAll('.del').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.i);if(confirm('이 항목을 삭제할까요?')){data[current].splice(i,1);panel()}});
 if(current==='alltext')loadAllTextEditor();
 if(current==='cloud'&&window.CMS_ADMIN_CLOUD?.bind)window.CMS_ADMIN_CLOUD.bind();
 if(current==='media')loadMedia();
}
function collect(){if(current==='profile'){data.profile.career=(document.querySelector('[data-k="profile.career"]')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean)}if(current==='kaim'){document.querySelectorAll('[data-k^="kaim."]').forEach(e=>data.kaim[Number(e.dataset.k.split('.')[1])]=e.value)}if(['courses','assets','records'].includes(current)){const cfg=getRowsConfig();data[current]=[...document.querySelectorAll('#list .row')].map(r=>{const o={};cfg.fields.forEach(([k],i)=>{o[k]=r.querySelectorAll('input')[i]?.value||''});return o})}}
function save(){collect();localStorage.setItem(KEY,JSON.stringify(data));document.getElementById('status').textContent='저장됨 · '+new Date().toLocaleTimeString('ko-KR');}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{collect();current=b.dataset.tab;document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x===b));panel();window.CMS_ADMIN_CLOUD?.bind()});
document.getElementById('save').onclick=save;
document.getElementById('reset').onclick=()=>{if(confirm('현재 브라우저의 저장 데이터를 초기 데이터로 복원할까요?')){data=clone(defaults);localStorage.setItem(KEY,JSON.stringify(data));current='profile';document.querySelectorAll('nav button').forEach((x,i)=>x.classList.toggle('active',i===0));panel();document.getElementById('status').textContent='초기 데이터로 복원됨'}};
document.getElementById('export').onclick=()=>{collect();const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='site-data.json';a.click();URL.revokeObjectURL(a.href)};
document.getElementById('import').onclick=()=>document.getElementById('importFile').click();
document.getElementById('importFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{data=JSON.parse(r.result);localStorage.setItem(KEY,JSON.stringify(data));panel();alert('JSON 데이터를 불러왔습니다.')}catch(err){alert('JSON 형식이 올바르지 않습니다.')}};r.readAsText(f);e.target.value=''};
document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x.dataset.tab===current));panel(); window.CMS_ADMIN_CLOUD?.bind();
