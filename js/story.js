(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const safe=v=>{try{return ['http:','https:'].includes(new URL(v,location.href).protocol)?v:''}catch{return ''}};
const set=(id,v)=>document.getElementById(id).innerHTML=v;
function render(d){
set('identity-facts','<div class="problem-statement"><p>정책의 출발점은 현장의 문제를 객관적이고 입체적으로 정의하는 데 있습니다. 그러나 민원 대응과 반복적인 문서 업무에 쫓기는 행정 현장에서는 현상을 분석하고 근본 원인을 살필 시간이 부족합니다.</p><p>AI는 이러한 부담을 줄이고, 문제 발견과 데이터에 기반한 원인 분석을 돕는 도구입니다. 이를 실제 행정업무에 연결해 현장에 맞는 정책을 개발하고, 일하는 방식을 개선하는 방법을 찾습니다.</p></div>');
const x=d.experience||PS_STORY_DEFAULTS.experience;set('expertise-content','<p class="section-intro">'+esc(x.lead||'국가 정책 연구와 대외 협력, 지방자치단체 교육·연구·정책개발 경험을 바탕으로 공공부문의 AI 활용과 업무 재설계를 지원합니다.')+'</p><div class="experience-columns">'+[['주요 경력',x.professional],['핵심 전문 영역',x.expertise],['현장 수행 경험',x.field]].map(([title,text])=>'<article><h3>'+title+'</h3><ul>'+String(text||'').split(/\n/).filter(Boolean).map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul></article>').join('')+'</div>');
set('records-content',(d.records||[]).map(r=>'<div class="year">'+esc(r.year)+'<br><small>'+esc(r.theme)+'</small></div><div>'+r.items.map(t=>'<p>'+esc(t)+'</p>').join('')+'</div>').join(''));
set('perspective-content',(d.problems||[]).map((p,i)=>'<article><b>'+String(i+1).padStart(2,'0')+'</b><h3>'+esc(p.title)+'</h3><p>'+esc(p.desc)+'</p></article>').join(''));
set('assets-intro',esc(d.portfolio?.leadDesc||'교육과정을 설계하고 현장에서 사용하는 교재와 실습도구를 개발합니다. 행정업무를 지원하는 도구와 검증된 결과를 지식자산으로 축적합니다.'));
const book=d.book||{},meta=PS_STORY_DEFAULTS.book;const visible=(d.assets||[]).filter(a=>a.public!==false&&a.id!=='BOOK01');set('asset-summary','<article class="book-summary"><h3>'+esc(book.title||'개인 저서 1권')+'</h3><p>'+esc(book.publisher??meta.publisher)+' · '+esc(book.publicationDate??meta.publicationDate)+' · ISBN '+esc(book.isbn??meta.isbn)+'</p></article><h3>교육과정</h3><ul class="plain-list">'+(d.courses||[]).map(c=>'<li><strong>'+esc(c.name)+'</strong><span>'+esc(c.target)+' · '+esc(c.hours)+'</span></li>').join('')+'</ul><h3>교재·도구·지식자산</h3><ul class="plain-list">'+visible.filter(a=>a.category!=='Education Programs').map(a=>'<li><strong>'+esc(a.title)+'</strong><span>'+esc(a.category)+(a.registered&&a.registrationNumber?' · '+esc(a.registrationNumber):'')+'</span></li>').join('')+'</ul>');
set('footer-channels',(d.story?.channels||PS_STORY_DEFAULTS.story.channels).map(c=>safe(c.url)?'<a href="'+esc(c.url)+'" target="_blank" rel="noopener">'+esc(c.name)+' ↗</a>':'').join(''));
}
const original=V12_ASSETS.render;V12_ASSETS.render=d=>{original(d);render(d)};
})();