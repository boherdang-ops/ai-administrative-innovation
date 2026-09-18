/* Cloud CMS adapter — Supabase REST/Auth, with LocalStorage fallback. */
(function(){
  const CFG_KEY='labPortfolioCloudConfig'; const DEFAULT={url:'',anonKey:''}; let accessToken='';
  const cfg=()=>{try{return {...DEFAULT,...JSON.parse(localStorage.getItem(CFG_KEY)||'{}')}}catch(e){return DEFAULT}};
  const headers=(token,extra={})=>{const c=cfg();return {'apikey':c.anonKey,'Authorization':'Bearer '+(token||accessToken||c.anonKey),'Content-Type':'application/json','Accept':'application/json',...extra}};
  const ready=()=>{const c=cfg();return !!(c.url&&c.anonKey)}; const base=()=>cfg().url.replace(/\/$/,'');
  const setToken=t=>accessToken=t||'';
  const storageUrl=path=>base()+'/storage/v1/object/public/site-assets/'+path.split('/').map(encodeURIComponent).join('/');
  async function uploadImage(file,token){if(!ready())throw Error('cloud not configured');if(!file)throw Error('file missing');const t=token||accessToken;if(!t)throw Error('관리자 로그인이 필요합니다.');const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_'),path='uploads/'+Date.now()+'-'+safe;const r=await fetch(base()+'/storage/v1/object/site-assets/'+path,{method:'POST',headers:{'apikey':cfg().anonKey,'Authorization':'Bearer '+t,'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});if(!r.ok)throw Error('image upload '+r.status+' '+await r.text());return {path,url:storageUrl(path),name:file.name,type:file.type,size:file.size};}
  async function listImages(token){if(!ready())return [];const t=token||accessToken;if(!t)throw Error('관리자 로그인이 필요합니다.');const r=await fetch(base()+'/storage/v1/object/list/site-assets',{method:'POST',headers:headers(t),body:JSON.stringify({prefix:'uploads',limit:100,offset:0,sortBy:{column:'created_at',order:'desc'}})});if(!r.ok)throw Error('image list '+r.status+' '+await r.text());return (await r.json()||[]).filter(x=>x.name).map(x=>({...x,path:'uploads/'+x.name,url:storageUrl('uploads/'+x.name)}));}
  async function getState(token){if(!ready())return null;const r=await fetch(base()+'/rest/v1/site_state?id=eq.main&select=*',{headers:headers(token)});if(!r.ok)throw Error('cloud read '+r.status+' '+await r.text());return (await r.json())[0]||null;}
  async function updateState(payload,token){if(!ready())throw Error('cloud not configured');const r=await fetch(base()+'/rest/v1/site_state?id=eq.main',{method:'PATCH',headers:headers(token,{'Prefer':'return=representation'}),body:JSON.stringify(payload)});if(!r.ok)throw Error('cloud write '+r.status+' '+await r.text());return (await r.json())[0];}
  async function saveState(payload,token){return updateState(payload,token)}
  async function saveDraft(payload,token){return updateState({draft_data:payload.data||{},draft_text:payload.text||{},draft_images:payload.images||{},draft_updated_at:new Date().toISOString()},token)}
  async function publishState(payload,summary,token,userId){
    const current=await getState(token); const revision={site_id:'main',published_data:current?.published_data||{},published_text:current?.published_text||{},published_images:current?.published_images||{},published_by:userId||null,summary:summary||{}};
    if(userId) { const rr=await fetch(base()+'/rest/v1/site_revisions',{method:'POST',headers:headers(token,{'Prefer':'return=minimal'}),body:JSON.stringify(revision)}); if(!rr.ok)throw Error('revision '+rr.status+' '+await rr.text()); }
    return updateState({published_data:payload.data||{},published_text:payload.text||{},published_images:payload.images||{},updated_at:new Date().toISOString(),draft_data:payload.data||{},draft_text:payload.text||{},draft_images:payload.images||{},draft_updated_at:new Date().toISOString()},token);
  }
  async function revisions(token){if(!ready())return [];const r=await fetch(base()+'/rest/v1/site_revisions?site_id=eq.main&select=*&order=published_at.desc&limit=50',{headers:headers(token)});if(!r.ok)throw Error('revision read '+r.status+' '+await r.text());return await r.json();}
  async function getRevision(id,token){const r=await fetch(base()+'/rest/v1/site_revisions?id=eq.'+encodeURIComponent(id)+'&select=*',{headers:headers(token)});if(!r.ok)throw Error('revision '+r.status+' '+await r.text());return (await r.json())[0]||null;}
  async function restoreRevision(id,token){const x=await getRevision(id,token);if(!x)throw Error('버전을 찾을 수 없습니다.');return saveDraft({data:x.published_data,text:x.published_text,images:x.published_images},token);}
  window.CMS_CLOUD={config:cfg,setToken,uploadImage,listImages,storageUrl,saveConfig(c){localStorage.setItem(CFG_KEY,JSON.stringify(c));return c},ready,getState,saveState,saveDraft,publishState,revisions,getRevision,restoreRevision,CFG_KEY};
})();
