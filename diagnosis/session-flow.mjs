import {newRun} from './engine.mjs?v=20261019-3';
export function setupDefaults(run,target,resume=false){return resume&&run?.target===target?{role:run.role,scope:run.scope,environment:run.environment,selected:[...run.selected]}:{role:'실무자',scope:target==='personal'?'개인':'부서',environment:'unknown',selected:[]};}
export function beginOrResume(definition,target,context,previous,resume=false){
 if(!resume||previous?.target!==target)return newRun(definition,target,context);
 const next=structuredClone(previous);
 Object.assign(next,context,{status:'answering'});delete next.completedAt;
 // 선택 해제한 과정의 응답은 새 결과에 포함하지 않습니다. 시작 시점의 문항·규칙은 유지합니다.
 const allowed=new Set([...(target==='personal'?next.definition.personal:next.definition.organization),...next.definition.courses.filter(c=>next.selected.includes(c.id)).flatMap(c=>c.requirements)].map(q=>q.id));
 next.answers=Object.fromEntries(Object.entries(next.answers).filter(([id])=>allowed.has(id)));
 return next;
}
