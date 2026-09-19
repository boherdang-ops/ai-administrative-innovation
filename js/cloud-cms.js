/* V12 Cloud CMS adapter — Supabase Auth + REST + Storage. No service_role key in browser. */
(function(){
 const CFG_KEY='psV12SupabaseConfig'; let token='', user=null;
 const cfg=()=>{try{return {...(window.SUPABASE_CONFIG||{}),...JSON.parse(localStorage.getItem(CFG_KEY)||'{}')}}catch(e){return window.SUPABASE_CONFIG||{}}};
 const base=()=>String(cfg().url||'').replace(/\/$/,'');
 const ready=()=>!!(cfg().url&&cfg().anonKey);
 const h=(auth,extra={})=>({'apikey':cfg().anonKey,'Authorization':'Bearer '+(auth||token||cfg().anonKey),'Content-Type':'application/json','Accept':'application/json',...extra});
 async function req(path,opt={}){const r=await fetch(base()+path,opt);let body=null;const t=await r.text();try{body=t?JSON.parse(t):null}catch{body=t}if(!r.ok)throw Error((body&&body.msg)||(body&&body.message)||body||('HTTP '+r.status));return body}
 async function signIn(email,password){const x=await req('/auth/v1/token?grant_type=password',{method:'POST',headers:{'apikey':cfg().anonKey,'Content-Type':'application/json'},body:JSON.stringify({email,password})});token=x.access_token;user=x.user;sessionStorage.setItem('psV12Token',token);sessionStorage.setItem('psV12User',JSON.stringify(user));await assertAdmin();return x}
 async function restoreSession(){token=sessionStorage.getItem('psV12Token')||'';try{user=JSON.parse(sessionStorage.getItem('psV12User')||'null')}catch{};if(token){try{await assertAdmin();return true}catch{signOut()}}return false}
 function signOut(){token='';user=null;sessionStorage.removeItem('psV12Token');sessionStorage.removeItem('psV12User')}
 async function assertAdmin(){if(!token)throw Error('로그인이 필요합니다.');const x=await req('/rest/v1/cms_admins?select=email&limit=1',{headers:h(token)});if(!x||!x.length)throw Error('CMS 관리자 권한이 없습니다.');return true}
 async function getPublished(){if(!ready())return null;const x=await req('/rest/v1/site_published?id=eq.main&select=content,updated_at',{headers:h()});return x&&x[0]||null}
 async function getDraft(){await assertAdmin();const x=await req('/rest/v1/site_drafts?id=eq.main&select=content,updated_at',{headers:h(token)});return x&&x[0]||null}
 async function saveDraft(content){await assertAdmin();const x=await req('/rest/v1/site_drafts?id=eq.main',{method:'PATCH',headers:h(token,{'Prefer':'return=representation'}),body:JSON.stringify({content,updated_at:new Date().toISOString(),updated_by:user?.id||null})});return x&&x[0]}
 async function publish(content,summary={}){await assertAdmin();const old=await getPublished();await req('/rest/v1/site_revisions',{method:'POST',headers:h(token,{'Prefer':'return=minimal'}),body:JSON.stringify({site_id:'main',content:old?.content||{},published_by:user?.id||null,summary})});const x=await req('/rest/v1/site_published?id=eq.main',{method:'PATCH',headers:h(token,{'Prefer':'return=representation'}),body:JSON.stringify({content,updated_at:new Date().toISOString(),updated_by:user?.id||null})});await saveDraft(content);return x&&x[0]}
 async function revisions(){await assertAdmin();return await req('/rest/v1/site_revisions?site_id=eq.main&select=*&order=published_at.desc&limit=50',{headers:h(token)})}
 async function restoreRevision(id){await assertAdmin();const x=await req('/rest/v1/site_revisions?id=eq.'+encodeURIComponent(id)+'&select=content&limit=1',{headers:h(token)});if(!x?.[0])throw Error('버전을 찾을 수 없습니다.');await saveDraft(x[0].content);return x[0].content}
 const storageUrl=p=>base()+'/storage/v1/object/public/site-assets/'+p.split('/').map(encodeURIComponent).join('/');
 async function uploadImage(file,folder='uploads'){await assertAdmin();const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=folder+'/'+Date.now()+'-'+safe;const r=await fetch(base()+'/storage/v1/object/site-assets/'+path,{method:'POST',headers:{'apikey':cfg().anonKey,'Authorization':'Bearer '+token,'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});if(!r.ok)throw Error(await r.text());return {path,url:storageUrl(path)} }
 function saveConfig(c){localStorage.setItem(CFG_KEY,JSON.stringify(c));window.SUPABASE_CONFIG=c;return c}
 window.V12_CLOUD={ready,cfg,saveConfig,signIn,signOut,restoreSession,assertAdmin,getPublished,getDraft,saveDraft,publish,revisions,restoreRevision,uploadImage,get user(){return user}};
})();