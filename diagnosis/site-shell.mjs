// 진단 사이트 전용 브랜드. 공통 헤더·푸터 변경 시 tools/update-shell.mjs를 실행합니다.
const home='https://happybrain.ai.kr/';
const services='https://boherdang-ops.github.io/ai-administrative-innovation/';
const external=(href,label,cls='')=>`<a href="${href}" class="${cls}" target="_blank" rel="noopener noreferrer">${label}</a>`;
export function siteHeader(base='./'){return `<header class="site-header"><div class="site-header-inner"><a class="site-brand" href="${base}" data-diagnosis-home aria-label="공공 AI 역량진단 첫 화면"><img src="${base}diagnosis-mark.png" width="50" height="50" alt=""><span><small>PUBLIC AI READINESS</small><strong>공공 AI 역량진단</strong></span></a><nav aria-label="주 메뉴">${external(home,'홈페이지')}${external(services+'courses/','교육 안내')}${external(services+'learning/','Learning Hub')}${external(services+'practice/','실무지원')}${external(home+'contact/','사업 문의','site-contact')}</nav></div></header>`;}
export function siteFooter(base='./'){return `<footer class="site-footer"><div class="site-footer-inner"><div><strong>공공 AI 역량진단</strong><p>나의 활용 역량과 우리의 실행 준비를 확인합니다.</p></div><div class="site-footer-meta"><span>자가응답 기반 · 예비 자가진단</span><a href="${base}#review">문항·판정 기준 검토</a></div></div></footer>`;}
