import {actionAdvice} from './action-advice.mjs?v=cms1';
import {domainInsights} from './domain-insights.mjs?v=cms1';
import {INTENTS} from './data/question-intents.mjs';
const names={strong:'강점 응답',develop:'보완 응답',unknown:'확인 필요',skipped:'미응답'};
export function category(value){if(value===undefined||value==='')return 'skipped';if(['consistent','correct','evidenced'].includes(value))return 'strong';if(['supported','notyet','incorrect','no','partial'].includes(value))return 'develop';return 'unknown';}
export const DOMAIN_MEANING={
'AI 이해와 한계 인식':'오류 가능성을 설명하는 능력, 실제 출처 대조 경험, 근거 없는 조항에 대한 판단을 함께 살폈습니다.',
'업무 문제 정의':'요청의 완료 기준을 정하는 능력과 AI·사람의 역할을 나누는 경험을 살폈습니다.',
'요청과 자료 구성':'자료의 허용 범위를 고르고 결과가 틀렸을 때 원인을 찾아 수정하는지를 살폈습니다.',
'결과 검증과 책임':'원문 대조 능력, 새 사례 재시험 경험, 독립적인 검증 판단을 함께 살폈습니다.',
'업무 적용과 공유':'동료가 재현할 안내와 전체 작업시간을 확인하는 경험·판단을 살폈습니다.',
'전략과 리더십':'무엇을 먼저 바꾸고 누가 책임·승인할지의 명확성을 살폈습니다.',
'이용 환경과 인프라':'도구 보유보다 승인된 환경에서 실제로 작업할 수 있는 조건을 살폈습니다.',
'데이터와 보안':'자료의 사용 경계와 최신성·갱신 책임이 함께 정해졌는지 살폈습니다.',
'인력과 교육':'참여자의 실제 기초 수행과 지속 참여할 역할·인력이 있는지 살폈습니다.',
'업무와 적용 과제':'적용 범위의 구체성과 적용 전후를 비교할 기준선 준비를 살폈습니다.',
'운영과 성과 관리':'비용·시간·유지 책임과 오류·변경 이후 대응이 함께 준비됐는지 살폈습니다.'};
const personalOrder=['P09','P03','P12','P10','P07','P11','P04','P05','P08','P13','P14','P15','P01','P02','P06'];
const orgOrder=['O05','O02','O03','O04','O12','O07','O09','O10','O08','O06','O11','O01'];
function evidence(q,answers){return {id:q.id,topic:q.topic||INTENTS[q.id]?.topic||q.domain,question:q.text,value:answers[q.id],answer:q.options.find(o=>o[0]===answers[q.id])?.[1]||'미응답',category:category(answers[q.id])};}
export function analyze(run,result){const personal=run.target==='personal';const basic=personal?run.definition.personal:run.definition.organization;const all=[...basic,...(personal?[]:run.definition.courses.filter(c=>run.selected.includes(c.id)).flatMap(c=>c.requirements))];const ev=all.map(q=>evidence(q,run.answers));const byId=Object.fromEntries(ev.map(e=>[e.id,e]));const totals={strong:0,develop:0,unknown:0,skipped:0};for(const e of ev)totals[e.category]++;
const domains=[...new Set(basic.map(q=>q.domain))].map(name=>{const items=basic.filter(q=>q.domain===name).map(q=>byId[q.id]);const counts={strong:0,develop:0,unknown:0,skipped:0};for(const e of items)counts[e.category]++;const total=items.length;const insights=domainInsights(name,items,run.cms?.domains);return {name,items,counts,total,meaning:run.cms?.meaning?.[name]||DOMAIN_MEANING[name],interpretation:insights.map(s=>s.text).join(" "),insights};});
const contradictions=[];if(personal){for(const [a,b] of [['P01','P03'],['P10','P12'],['P07','P09']])if(byId[a]?.category==='strong'&&byId[b]?.value==='incorrect')contradictions.push({ids:[a,b],text:`${byId[a].topic}에 대한 자기평가와 ${byId[b].topic}의 상황 선택이 다릅니다. 실제 사례에서 판단 과정을 다시 확인할 필요가 있습니다.`,evidence:[byId[a],byId[b]]});}
let headline,interpretation;
if(!ev.some(e=>!['unknown','skipped'].includes(e.category))){headline='현재 상태를 판단할 응답 근거가 더 필요합니다';interpretation='모름·해당 없음·미응답은 역량 부족과 다릅니다. 먼저 실제 경험 또는 담당자 확인으로 응답 근거를 채우는 것이 다음 행동입니다.';}
else if(personal&&byId.P09?.value==='incorrect'){headline='실제 자료를 쓰기 전에 자료 보호 판단부터 점검하세요';interpretation='민원 자료 상황에서 이름만 지운 뒤 외부 AI에 입력하는 선택을 했습니다. 다른 활용 경험과 별개로, 자료 사용 허용 범위와 재식별 가능성을 먼저 확인해야 합니다.';}
else if(contradictions.length){headline='스스로 아는 것과 상황에서 고르는 행동을 맞춰볼 단계입니다';interpretation='일부 자기평가와 상황판단 응답이 다릅니다. 이는 역량 부족의 확정이 아니라 실제 업무 사례로 확인할 우선 과제가 있다는 뜻입니다.';}
else if(!personal&&['no','partial'].includes(byId.O05?.value)){headline='자료 사용 경계를 먼저 정리해야 실행이 안정됩니다';interpretation='자료 범위·접근 권한·외부 입력 기준의 일부 또는 전부가 정해지지 않았다고 응답했습니다. 도구나 인력이 준비됐더라도 이 조건을 먼저 정리해야 무리한 적용을 줄일 수 있습니다.';}
else if(totals.develop){headline=personal?'활용을 반복 가능한 업무 방식으로 다듬을 단계입니다':'준비된 기반을 활용하되 실행의 빈틈을 먼저 메우세요';interpretation=personal?'가능하다고 답한 부분과 도움·연습이 필요한 부분이 함께 있습니다. 아래 우선 행동을 작은 실제 사례로 수행하고 기록하면 무엇이 달라졌는지 확인할 수 있습니다.':'일부 요건은 갖췄지만 미비한 조건이 남아 있습니다. 개인 교육만으로 해결할 과제와 책임·환경·자료를 협의할 과제를 나누어 추진하는 것이 합리적입니다.';}
else if(totals.unknown+totals.skipped){headline='확인된 강점 위에 미확인 조건을 채워갈 단계입니다';interpretation='긍정적인 응답이 있으나 확인이 끝나지 않은 항목도 있습니다. 미확인 항목을 추측으로 채우기보다 경험·기록·담당자 답변으로 확인하세요.';}
else{headline=personal?'응답에서 확인된 강점을 실제 수행 기록으로 남겨보세요':'응답상 주요 조건이 갖춰져 있습니다. 실행 전 유효성을 확인하세요';interpretation=personal?'모든 문항에 긍정적인 수행·경험·판단으로 응답했습니다. 이 결과가 실제 수행의 인증은 아닙니다. 새 사례와 동료 재현으로 확인한 결과가 다음 개선의 근거가 됩니다.':'준비와 확인자료가 있다고 응답했습니다. 실제 자료·도구·권한·담당자가 현재도 유효한지 확인하고, 승인된 작은 범위에서 시험한 뒤 확대 여부를 판단하세요.';}
if(personal&&totals.develop&&!contradictions.length){const scenarios=basic.filter(q=>q.kind==='scenario');if(scenarios.every(q=>byId[q.id]?.category==='strong')){headline='판단 원칙을 실제 수행·반복 경험으로 연결할 단계입니다';const topics=ev.filter(e=>e.category==='develop').map(e=>e.topic);interpretation='상황 문항에서는 원문 확인, 자료 보호, 검증과 효과 측정의 적절한 행동을 선택했습니다. 다만 '+topics.slice(0,2).join('·')+' 등에서 도움이나 추가 경험이 필요하다고 응답했습니다. 원칙을 모른다고 보기보다, 알고 있는 방법을 실제로 수행하고 반복할 수 있도록 점검표·동료 도움·수행 기록을 연결하는 것이 다음 과제입니다.';}}
const order=personal?personalOrder:orgOrder;const candidates=ev.filter(e=>e.category!=='strong').sort((a,b)=>{const rank=e=>(e.category==='develop'?0:0.25)+(order.includes(e.id)?order.indexOf(e.id):30+all.findIndex(q=>q.id===e.id));return rank(a)-rank(b);});
const actions=candidates.slice(0,3).map((e,i)=>{const q=all.find(q=>q.id===e.id);const unknown=['unknown','skipped'].includes(e.category);return {priority:i+1,id:e.id,title:e.topic+(unknown?' 확인':' 보완'),answer:e.answer,...actionAdvice(e,q,{personal,role:run.role,advice:run.cms?.advice}),timing:personal?'다음 실제 활용 전':'과정 착수·업무 적용 전'};});
if(!actions.length)actions.push({priority:1,id:personal?'P11':'O12',title:personal?'새 사례로 강점 확인':'작은 범위의 시험 실행',why:'긍정적인 자기응답을 실제 수행 근거와 연결하기 위한 후속 행동입니다.',answer:'전체 문항에 강점 응답',task:personal?'새로운 공개·가상 사례 한 건을 처리하고 동료에게 같은 절차를 재현하도록 요청하세요.':'승인된 작은 업무 범위에서 실행하고 오류 시 중단·복귀와 기록을 확인하세요.',doneWhen:personal?'새 사례 결과와 동료 재현 기록':'실행·중단·복귀 점검 기록',owner:personal?'본인·동료':'업무 책임자·현업 담당',timing:'확대 적용 전'});
const strengths=ev.filter(e=>e.category==='strong').sort((a,b)=>(order.indexOf(a.id)<0?99:order.indexOf(a.id))-(order.indexOf(b.id)<0?99:order.indexOf(b.id))).slice(0,3);
const courseMatrix=result.courses.map(c=>({id:c.courseId,title:run.definition.courses.find(x=>x.id===c.courseId).title,label:c.label,key:c.key,common:c.checks.filter(x=>x.id.startsWith('O')),specific:c.checks.filter(x=>!x.id.startsWith('O')),blockers:c.gaps.length,pending:c.unconfirmed.length}));
const environment=personal?(run.environment==='restricted'?'기관의 AI 이용 환경에 제한이 있다고 응답했습니다. 이 제약은 개인 역량의 부족으로 계산하지 않았습니다. 허용된 교육장·가상 자료 실습과 현업 적용을 나누어 준비하세요.':run.environment==='unknown'?'승인된 이용 환경이 미확인 상태입니다. 개인의 활용 능력과 별도로 기관의 도구·자료 사용 범위를 확인하세요.':'승인된 환경을 이용할 수 있다고 응답했습니다. 환경 이용 가능 여부와 결과 검증 책임은 별개입니다.'):'기관 결과는 선택한 '+run.scope+'와 응답자가 확인한 범위에 한정합니다. 개인 평균이나 기관 전체의 확정 평가로 해석하지 않습니다.';
return {version:'interpretation-2026-10-19.5',headline,interpretation,environment,domains,totals,total:ev.length,answered:ev.filter(e=>e.category!=='skipped').length,strengths,actions,contradictions,courseMatrix,evidence:ev,unknown:ev.filter(e=>e.category==='unknown'),unanswered:ev.filter(e=>e.category==='skipped'),legend:names,reflection:personal?'다음에 같은 업무를 맡았을 때, 오늘 확인한 방법을 다른 사람도 따라 할 수 있을까요?':'담당자가 바뀌거나 도구가 멈춰도, 지금 준비한 방식으로 업무를 이어갈 수 있을까요?'};
}
