const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const oldConditionHint='아래 확인 항목을 모두 갖추면 첫 번째, 일부만 갖추면 두 번째 답변을 선택하세요. 직접 확인하지 않은 내용은 추측하지 마세요.';
export function questionGuidance(q,reviewed=false){
 if(!reviewed)return `${q.purpose?`<p class="question-purpose"><strong>확인하려는 것</strong> ${esc(q.purpose)}</p>`:''}${q.criteria?.length?`<ul class="question-criteria" aria-label="판단할 항목">${q.criteria.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}${q.hint?`<p class="muted question-hint">${esc(q.hint)}</p>`:''}`;
 if(q.kind==='scenario')return '<p class="muted question-hint">문항에 제시된 조건에서 가장 적절하다고 생각하는 행동 한 가지를 선택하세요.</p>';
 if(q.kind==='condition')return `${q.criteria?.length?`<div class="question-range"><strong>이번 문항의 확인 범위</strong><ul>${q.criteria.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>`:''}<p class="muted question-hint">${esc(q.hint&&q.hint!==oldConditionHint?q.hint:'직접 확인한 범위에 맞는 답변을 선택하세요. 일부만 확인했다면 그 상태를 구분하고, 확인하지 않은 내용은 추측하지 마세요.')}</p>`;
 return q.hint?`<p class="muted question-hint">${esc(q.hint)}</p>`:'';
}
export function questionRationale(q){if(!q)return '';return `<details class="question-rationale"><summary>${esc(q.id)} · 질문과 해석 관점</summary><p>${esc(q.text)}</p>${q.purpose?`<p><strong>확인하려는 것</strong> ${esc(q.purpose)}</p>`:''}${q.criteria?.length?`<ul>${q.criteria.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}</details>`;}
