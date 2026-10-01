/* Additive V12 Asset Library: only the existing #works section and works CMS tab. */
(()=>{
const cats=['Education Programs','Learning Materials','Practice Tools','Administrative Tools','Diagnostic & Content Tools'];
const labels=['교육과정','교재','실습도구','행정지원도구','진단·콘텐츠 도구'];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const copy=x=>JSON.parse(JSON.stringify(x));
function ensure(d){
 if(!Array.isArray(d.assets)){
  d.assets=copy(window.V12_ASSET_DEFAULTS.assets);
  const legacy={'교육과정':'Education Programs','교재':'Learning Materials','실습도구':'Practice Tools','AI 역량 진단 및 사전진단':'Diagnostic & Content Tools'};
  for(const w of d.works||[])if(w.image){const a=d.assets.find(a=>a.category===legacy[w.title]);if(a)a.image=w.image;}
 }
 if(d.assetMessage===undefined)d.assetMessage=window.V12_ASSET_DEFAULTS.assetMessage;
 d.assetSchemaVersion=1;return d;
}
function safeURL(v){
 if(!v||/[\u0000-\u0020\\]/.test(v))return '';
 try{const u=new URL(v,location.href);return ['http:','https:'].includes(u.protocol)?v:''}catch{return ''}
}
function safeImage(v){return /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v||'')?v:safeURL(v)}
function isRegistered(a){return a.registered===true&&a.registrationNumber&&a.registrationDate&&(a.kind!=='app'||['APP05','APP06'].includes(a.id));}
function card(a,i){const url=safeURL(a.url),image=safeImage(a.image);return `<article data-asset-id="${esc(a.id)}">${image?`<img class="work-image" src="${esc(image)}" alt="${esc(a.title)}" loading="lazy">`:''}<b>${String(i+1).padStart(2,'0')} / ${esc(a.category)}</b><h3>${esc(a.title)}</h3><p>${esc(a.desc)}</p><p class="asset-use">${esc(a.use)}</p>${isRegistered(a)?'<span class="asset-badge">REGISTERED</span>':''}${url?`<a class="asset-link" href="${esc(url)}" target="_blank" rel="noopener">${a.kind==='material'?'교재 보기':'도구 열기'} ↗</a>`:''}</article>`}
function render(d){
 const section=document.querySelector('#works');if(!section)return;
 section.querySelector('#asset-message').textContent=d.assetMessage;
 const visible=d.assets.filter(a=>a.public!==false);
 section.querySelector('.works').innerHTML=visible.filter(a=>a.featured===true).slice(0,8).map(card).join('');
 section.querySelector('#asset-categories').innerHTML=cats.map((c,i)=>`<span><b>${esc(c)}</b><small>${labels[i]}</small></span>`).join('');
 const all=section.querySelector('#all-assets'),button=section.querySelector('#view-all-assets'),filter=section.querySelector('#asset-filter');
 filter.innerHTML='<option value="">전체 자산</option>'+cats.map((c,i)=>`<option value="${esc(c)}">${labels[i]} / ${esc(c)}</option>`).join('');
 const update=()=>{const xs=visible.filter(a=>!filter.value||a.category===filter.value);all.querySelector('.asset-all-list').innerHTML=xs.map(card).join('');section.querySelector('#asset-count').textContent=`${xs.length}개 자산`;};
 update();filter.onchange=update;
 button.onclick=()=>{all.hidden=!all.hidden;button.setAttribute('aria-expanded',String(!all.hidden));button.textContent=all.hidden?'VIEW ALL ASSETS':'CLOSE ALL ASSETS';};
 const registered=visible.filter(isRegistered);
 section.querySelector('#intellectual-assets').innerHTML=`<p class="eyebrow">INTELLECTUAL ASSETS</p><h3>${registered.length} REGISTERED WORKS</h3><p>교육과정 기획안 · 교육교재 · 실습 앱을 등록 지식자산으로 축적합니다.</p><div class="asset-register-list">${registered.map(a=>`<details><summary>${esc(a.title)} <span class="asset-badge">REGISTERED</span></summary><dl><dt>등록 저작물명</dt><dd>${esc(a.registeredTitle||a.title)}</dd><dt>등록번호</dt><dd>${esc(a.registrationNumber)}</dd><dt>등록일</dt><dd>${esc(a.registrationDate)}</dd></dl></details>`).join('')}</div>`;
}
function validate(d){
 const ids=new Set();for(const a of d.assets){
  if(!a.id||ids.has(a.id))throw Error('자산 ID는 비어 있거나 중복될 수 없습니다.');ids.add(a.id);
  if(!a.title?.trim()||!cats.includes(a.category))throw Error('모든 자산의 이름과 5개 자산분류를 확인해 주세요.');
  if(a.url&&!safeURL(a.url))throw Error('실행 URL은 웹 주소 또는 상대 경로로 입력해 주세요.');
  if(a.image&&!safeImage(a.image))throw Error('대표 이미지 주소를 확인해 주세요.');
  if(a.registered){
   if(a.kind==='app'&&!['APP05','APP06'].includes(a.id))throw Error('등록 앱은 APP05와 APP06만 설정할 수 있습니다.');
   if(!/^C-\d{4}-\d{6}$/.test(a.registrationNumber)||!/^\d{4}-\d{2}-\d{2}$/.test(a.registrationDate)||!a.registeredTitle?.trim())throw Error('등록 자산의 저작물명·등록번호·등록일을 확인해 주세요.');
  }
 }
 const n=d.assets.filter(a=>a.public!==false&&a.featured===true).length;
 if(n<6||n>8)throw Error('공개 대표 자산은 6~8개로 선택해 주세요.');
}
function select(k,v,choices){return `<select data-k="${k}">${choices.map(([value,label])=>`<option value="${esc(value)}" ${v===value?'selected':''}>${esc(label)}</option>`).join('')}</select>`}
function check(k,v,label){return `<label class="asset-check"><input type="checkbox" data-k="${k}" ${v?'checked':''}>${label}</label>`}
function adminPanel(d,inp,ta,box,e){
 return box('개발성과 / 이미지 · Asset Library','기존 개발성과 데이터와 이미지는 보존합니다. 아래 자산을 관리하고 공개 대표 자산은 6~8개로 선택합니다.',
 `<label>05 핵심 문구</label>${ta('assetMessage',d.assetMessage)}<p class="hint">현재 공개 대표 자산 ${d.assets.filter(a=>a.public!==false&&a.featured).length}개 · 등록 자산 ${d.assets.filter(isRegistered).length}개</p>`+
 d.assets.map((a,i)=>{const k=`assets.${i}`;return `<details class="card asset-editor"><summary>${e(a.title||'새 자산')} · ${e(a.category)}</summary><div class="uploadbox"><div class="preview workpreview">${a.image?`<img src="${e(a.image)}" alt="대표 이미지">`:'이미지 없음'}</div><div><label>자산명</label>${inp(k+'.title',a.title)}<label>자산유형</label>${select(k+'.category',a.category,cats.map((c,j)=>[c,labels[j]+' / '+c]))}<label>형태</label>${select(k+'.kind',a.kind,[['program','교육과정·기획안'],['material','교재'],['app','앱·도구']])}<label>한 줄 설명</label>${ta(k+'.desc',a.desc)}<label>사용 교육과정·업무</label>${inp(k+'.use',a.use)}<label>실행 URL / 교재 경로</label>${inp(k+'.url',a.url)}<label>대표 이미지</label><input type="file" accept="image/*" data-assetfile="${i}"><label>대표 이미지 주소</label>${inp(k+'.image',a.image)}<button type="button" class="add" data-clearassetimage="${i}">이미지 삭제</button>${check(k+'.featured',a.featured,'대표 노출')}${check(k+'.public',a.public!==false,'공개')}${check(k+'.registered',a.registered,'저작권 등록 완료')}<label>등록 저작물명</label>${inp(k+'.registeredTitle',a.registeredTitle)}<label>등록번호</label>${inp(k+'.registrationNumber',a.registrationNumber)}<label>등록일</label>${inp(k+'.registrationDate',a.registrationDate,'date')}<small>자산 ID: ${e(a.id)} · 등록 앱은 APP05·APP06만 허용됩니다.</small><button type="button" class="del" data-delasset="${i}">자산 삭제</button></div></div></details>`}).join('')+
 '<button class="add" id="addAsset">+ 자산 추가</button>'+
 `<details class="card"><summary>기존 개발성과 / 이미지 원본</summary>${(d.works||[]).map((w,i)=>`<label>제목</label>${inp(`works.${i}.title`,w.title)}<label>설명</label>${ta(`works.${i}.desc`,w.desc)}<label>원본 이미지</label><input type="file" accept="image/*" data-workfile="${i}">${w.image?`<img class="legacy-image" src="${e(w.image)}" alt="${e(w.title)}">`:''}`).join('')}</details>`);
}
function bindAdmin(d,collect,panel,upload){
 document.getElementById('addAsset')?.addEventListener('click',()=>{collect();d.assets.push({id:'ASSET-'+crypto.randomUUID(),title:'새 자산',category:cats[0],kind:'program',desc:'',use:'',image:'',url:'',featured:false,public:false,registered:false,registeredTitle:'',registrationNumber:'',registrationDate:''});panel();});
 document.querySelectorAll('[data-delasset]').forEach(b=>b.onclick=()=>{collect();d.assets.splice(+b.dataset.delasset,1);panel();});
 document.querySelectorAll('[data-clearassetimage]').forEach(b=>b.onclick=()=>{collect();d.assets[+b.dataset.clearassetimage].image='';localStorage.setItem('psV12CMS',JSON.stringify(d));panel();});
 document.querySelectorAll('[data-assetfile]').forEach(input=>input.onchange=async()=>{const file=input.files?.[0],index=+input.dataset.assetfile;if(!file)return;collect();const a=d.assets[index];input.disabled=true;await upload(file,url=>{a.image=url;localStorage.setItem('psV12CMS',JSON.stringify(d));panel();},'portfolio');input.disabled=false;});
}
window.V12_ASSETS={ensure,render,validate,adminPanel,bindAdmin};
})();
