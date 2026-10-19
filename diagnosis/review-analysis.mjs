import {analyze as originalAnalyze,category} from './analysis.mjs?v=cms1';
export const PERSONAL_KEYS=['strong','assisted','develop','unknown','skipped'];
export const ORG_KEYS=['strong','develop','unknown','skipped'];
export function displayCategory(value,personal){return personal&&value==='supported'?'assisted':category(value);}
const freshCounts=()=>({strong:0,assisted:0,develop:0,unknown:0,skipped:0});
const topics=items=>items.map(e=>`‘${e.topic}’`).join('·');
export function analyze(run,result){
 const a=originalAnalyze(run,result),personal=run.target==='personal';
 const all=[...run.definition.personal,...run.definition.organization,...run.definition.courses.flatMap(c=>c.requirements)];const qs=Object.fromEntries(all.map(q=>[q.id,q]));
 a.evidence=a.evidence.map(e=>({...e,category:displayCategory(e.value,personal)}));
 a.totals=freshCounts();for(const e of a.evidence)a.totals[e.category]++;
 a.legend=personal?{strong:'독립 수행·반복 경험・적절한 판단',assisted:'도움받아 수행·일부 경험',develop:'수행·판단 보완',unknown:'확인 필요',skipped:'미응답'}:a.legend;
 a.domains=a.domains.map(d=>{const items=d.items.map(e=>({...e,category:displayCategory(e.value,personal)}));const counts=freshCounts();for(const e of items)counts[e.category]++;
  const strong=items.filter(e=>e.category==='strong'),assisted=items.filter(e=>e.category==='assisted'),gaps=items.filter(e=>e.category==='develop'),pending=items.filter(e=>['unknown','skipped'].includes(e.category));
  const ability=assisted.filter(e=>qs[e.id].answerType!=='experience'),experience=assisted.filter(e=>qs[e.id].answerType==='experience');
  const state=[strong.length?`이어갈 부분은 ${topics(strong)}입니다.`:'',ability.length?`${topics(ability)}에서는 도움을 받아 수행할 수 있다고 응답했습니다. 다음에는 도움의 어떤 부분을 혼자 재현할 수 있는지 살펴보세요.`:'',experience.length?`${topics(experience)}에서는 일부 경험이 있다고 응답했습니다. 다른 사례에 적용해 보고 반복 경험을 쌓는 것이 다음 과제입니다.`:'',gaps.length?`${personal?'수행 연습 또는 판단 점검':'준비 보완'}이 필요한 항목은 ${topics(gaps)}입니다. 아래 응답 근거와 다음 행동을 함께 확인하세요.`:'',pending.length?`추가 확인할 항목은 ${topics(pending)}입니다. ${pending.some(e=>e.value==='conflict')?'관련 담당자의 확인 내용이 서로 다른 항목은 근거를 대조한 뒤 갱신하세요.':'실제 경험이나 담당자 기록으로 현재 상태를 확인하세요.'}`:''].filter(Boolean).join(' ');
  const insights=d.insights.map((s,i)=>i===0?{...s,text:state}:i===1?{...s,text:s.text.replace('응답상 이 연결을 뒷받침하는 조건이 갖춰져 있습니다. 다만 실제 품질·시간 절약·운영 안정성이 확보됐다는 뜻은 아니므로 새로운 사례로 확인할 단계입니다.','새로운 사례에서 결과 품질·전체 작업시간·운영 안정성을 확인하고 현재의 강점을 이어가세요.')}:s);
  return {...d,items,counts,insights,interpretation:insights.map(s=>s.text).join(' ')};
 });
 a.actions=a.actions.map(t=>{const e=a.evidence.find(e=>e.id===t.id);return e?.category==='assisted'?{...t,title:e.topic+(qs[e.id].answerType==='experience'?' 경험 확장':' 자립 연습')}:t;});
 a.interpretation=a.interpretation.replace('이 결과가 실제 수행의 인증은 아닙니다. ','');
 a.courseMatrix=a.courseMatrix.map(c=>({...c,label:c.key==='ready'?'선행 조건 확인 · 착수 전 점검':c.label}));
 return a;
}
