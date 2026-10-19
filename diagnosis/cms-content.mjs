import {DEFAULT_DEFINITION,LINKS,validateDefinition} from './data/definition.mjs?v=cms1';
import {DOMAIN_PROFILES} from './domain-insights.mjs?v=cms1';
import {DOMAIN_MEANING} from './analysis.mjs?v=cms1';
import {DEFAULT_ADVICE} from './action-advice.mjs?v=cms1';
import {COPY_CATALOG} from './data/copy-catalog.mjs';
export const DEFAULT_CONTENT={schemaVersion:1,
 site:{title:'공공 AI 역량진단',eyebrow:'PUBLIC AI READINESS',description:'공공 AI 역량과 과정 착수 준비도를 확인하는 예비 자가진단',logoUrl:'https://boherdang-ops.github.io/ai-administrative-innovation/diagnosis/diagnosis-mark.png?v=20261019-8',
 nav:[{label:'홈페이지',url:LINKS.home,visible:true},{label:'교육 안내',url:LINKS.courses,visible:true},{label:'Learning Hub',url:LINKS.learning,visible:true},{label:'실무지원',url:LINKS.practice,visible:true},{label:'사업 문의',url:LINKS.home+'contact/',visible:true}],
 footerTitle:'공공 AI 역량진단',footerDescription:'나의 활용 역량과 우리의 실행 준비를 확인합니다.',footerMeta:'자가응답 기반 · 예비 자가진단'},
 definition:structuredClone(DEFAULT_DEFINITION),domains:structuredClone(DOMAIN_PROFILES),meaning:structuredClone(DOMAIN_MEANING),advice:structuredClone(DEFAULT_ADVICE),links:{...LINKS},copy:Object.fromEntries(Object.entries(COPY_CATALOG).map(([k,v])=>[k,v.text]))};
export function safeURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}}
export function validateContent(input){
 if(!input||input.schemaVersion!==1||JSON.stringify(input).length>1500000)throw Error('CMS 콘텐츠 형식 또는 크기를 확인하세요.');
 function shape(value,base,path=''){if(Array.isArray(base)){if(!Array.isArray(value)||value.length!==base.length)throw Error(path+' 항목 수를 유지하세요.');base.forEach((v,i)=>shape(value[i],v,path+'.'+i));}
 else if(base&&typeof base==='object'){if(!value||Array.isArray(value)||typeof value!=='object')throw Error(path+' 형식 오류');const keys=Object.keys(base);if(Object.keys(value).length!==keys.length||keys.some(k=>!Object.hasOwn(value,k)))throw Error(path+' 필수 항목을 유지하세요.');for(const k of keys){if(['__proto__','constructor','prototype'].includes(k))throw Error('허용하지 않는 항목');shape(value[k],base[k],path+'.'+k);}}
 else if(typeof value!==typeof base||typeof value==='string'&&(value.length>12000||value.includes('\u0000')))throw Error(path+' 값의 형식·길이를 확인하세요.');}
 shape(input,DEFAULT_CONTENT);
 const d=validateDefinition(input.definition,{cms:true});
 const a=[...DEFAULT_CONTENT.definition.personal,...DEFAULT_CONTENT.definition.organization,...DEFAULT_CONTENT.definition.courses.flatMap(c=>c.requirements)];
 const b=[...d.personal,...d.organization,...d.courses.flatMap(c=>c.requirements)];
 for(let i=0;i<a.length;i++){for(const k of ['domain','target','answerType','required','branch','correct','mandatory','foundation'])if(a[i][k]!==b[i][k])throw Error(a[i].id+' 판정 구조는 변경할 수 없습니다.');for(const o of b[i].options)if(!o[1].trim())throw Error(a[i].id+' 선택지 문구가 비어 있습니다.');}
 for(const u of [input.site.logoUrl,...input.site.nav.map(n=>n.url),...Object.values(input.links),...d.courses.map(c=>c.url)])if(!safeURL(u))throw Error('주소는 인증정보가 없는 https 주소를 사용하세요.');
 if(!input.site.title.trim()||!input.site.footerTitle.trim())throw Error('사이트 이름을 입력하세요.');
 return structuredClone({...input,definition:d});
}
export function translateText(text,content){const pairs=Object.entries(content?.copy||{}).filter(([a,b])=>a!==b).sort((a,b)=>b[0].length-a[0].length);if(!pairs.length)return text;const map=new Map(pairs);const re=new RegExp(pairs.map(([k])=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');return String(text).replace(re,k=>map.get(k));}
export function translateDOM(root,content){const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walk.nextNode())nodes.push(walk.currentNode);root.querySelectorAll('option').forEach(o=>o.value=o.value);for(const node of nodes)if(!node.parentElement.closest('script,style,textarea,input'))node.nodeValue=translateText(node.nodeValue,content);for(const el of root.querySelectorAll('[aria-label],[title]'))for(const a of ['aria-label','title'])if(el.hasAttribute(a))el.setAttribute(a,translateText(el.getAttribute(a),content));}
