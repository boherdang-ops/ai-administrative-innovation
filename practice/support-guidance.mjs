// Runtime guidance shared by the published practice bundle and diagnosis report.
// No AI calls, CMS writes, answer transmission, or assessment-rule changes.
export function requestMode(mode, original) {
  if (mode !== 'approach') return original;
  return {...original, instruction: '사용자가 원하는 산출물·분량·핵심 사실을 제공했고 미정을 표시해도 목적이 성립하면 검토용 초안부터 작성하십시오. 이미 제공된 내용은 다시 묻지 마십시오. 결론·적법성·실행가능성을 바꾸는 핵심 정보가 없거나 자료가 충돌하면 그 항목만 최대 3개 질문하십시오. 접근 방법만 요청하면 대안을 비교하십시오. 확인 사실·제안·미확인을 구분하고 초안 뒤에 검산과 담당자 확인 사항을 분리하십시오.'};
}

export function requestPlan(mode, original) {
  if (mode !== 'approach') return original;
  return {...original,
    stages: ['자료·목적과 요청한 산출물을 확인합니다.', '자료가 충분하면 검토용 초안부터, 핵심 정보가 부족하면 필요한 항목만 질문합니다.', '검산·미확인 사항과 담당자 검토 항목을 구분합니다.'],
    output: '요청한 형식의 검토용 초안 / 원자료 대조·검산 / 미확인·담당자 확인 사항. 방법만 요청한 경우에는 실행 대안과 첫 단계를 제시합니다.',
    start: '초안의 목적이 성립하면 미정 사항을 표시하고 먼저 작성하십시오. 민원은 접수·처리경과 안내와 최종 처리결과 회신을 구분하고, 실제 확인 사실·처리 판단·적용 근거가 부족하면 최종 회신에 필요한 항목만 질문하십시오. 경과 안내를 최종 회신으로 표현하지 말고 발송 전 담당부서·공식 문의처를 확인하십시오. 일정·예산·권한·협의 결과를 추정하지 마십시오. 행사 시간표의 합계와 강사·장비·접근성·안전 조건을 대조하고, 예산 미정을 비예산으로 바꾸지 마십시오. 홍보물에 참석자 이름·전화번호 명단을 포함하지 마십시오. 이는 내부 출석관리 자료를 삭제하라는 뜻이 아닙니다. 보고 수치는 기간·단위·분모·중복 여부를 확인하여 연인원과 고유 인원을 구분하십시오. 집행률에는 예산액·집행액, 비용 효과에는 비용·성과자료가 필요하며 미확인 효과를 만들지 마십시오. 실제 제출 전 해당 기관의 서식·전결·검토 절차를 확인하십시오.'
  };
}

export function requestPrinciples(text) {
  return text.replace('파일·웹·공공데이터 API 또는 MCP 사용 가능 여부부터 확인하십시오.', '파일·웹·공공데이터 API 또는 MCP가 필요한 작업일 때만 사용 가능 여부를 확인하십시오. 제공 자료만으로 초안을 만들 수 있다면 도구 연결 질문을 먼저 하지 마십시오.');
}

const LESSONS = {
  '01-04': '공무원 표준 프롬프트 작성법', '01-05': 'AI 결과 검증하는 법',
  '01-06': '공공업무 AI 안전 활용', '02-01': '보고서 작성',
  '02-02': '사업계획서 작성', '02-03': '보도자료 작성',
  '02-04': '긴 문서 요약·간부보고', '02-05': '공문·시행문·협조문 작성하기',
  '02-06': '회의록·지시사항·후속조치', '02-07': '민원·질의회신·FAQ',
  '04-01': 'AI로 Excel·CSV 분석하기', '04-06': '공공데이터·KOSIS·OpenAPI',
  '06-01': '우리 업무에서 AI 적용점 찾기', '06-04': 'PoC·백테스팅·효과측정',
  '06-06': '부서 업무방식으로 확산', '07-06': '조직의 지식자산 축적'
};
function lesson(id, base, reason) {
  return LESSONS[id] ? {title: LESSONS[id], url: new URL('lesson.html?id=' + id, base).href, reason}
    : {title: '전체 학습 자료', url: new URL('library.html', base).href, reason: '맞는 자료를 전체 학습 목록에서 선택해 주세요.'};
}

export function practiceLearning(brief, selectedGuide, base) {
  if (selectedGuide) {
    const id = selectedGuide.lesson;
    if (/^track:(0[1-9]|10)$/.test(id)) return {title: selectedGuide.lessonName, url: new URL('track.html?t=' + id.slice(6), base).href, reason: '직접 선택한 참고 안내와 연결된 학습입니다.'};
    return lesson(id, base, '직접 선택한 참고 안내와 연결된 학습입니다.');
  }
  // Classify only the stated task, never uploaded evidence or hidden AI output.
  const task = String(brief.goal || '');
  const matches = [
    [/엑셀|excel|csv|집계|통계|데이터\s*분석/i, '04-01'],
    [/민원|질의\s*회신|문의\s*답변|불편\s*신고/, '02-07'],
    [/보도자료/, '02-03'], [/회의록|후속\s*조치/, '02-06'],
    [/행사|추진\s*계획|사업\s*계획/, '02-02'],
    [/요약|간부\s*보고|브리핑/, '02-04'], [/보고서|업무\s*보고/, '02-01']
  ];
  const match = matches.find(([pattern]) => pattern.test(task));
  return lesson(match?.[1], base, '입력한 업무 주제에 맞춰 참고할 학습입니다.');
}

const ACTION_LESSONS = {
  P01:'01-05', P02:'01-05', P03:'01-05', P04:'01-04', P05:'06-01',
  P06:'06-01', P07:'01-04', P08:'01-04', P09:'01-06', P10:'01-05',
  P11:'01-05', P12:'01-05', P13:'06-06', P14:'06-04', P15:'06-04',
  O01:'06-01', O02:'06-06', O03:'01-06', O04:'01-06', O05:'01-06',
  O06:'07-06', O07:'01-04', O08:'06-06', O09:'06-01', O10:'06-04',
  O11:'06-06', O12:'06-04'
};
export function diagnosisLearning(actions, base) {
  const first = actions[0];
  return lesson(ACTION_LESSONS[first?.id], base,
    first ? '첫 번째 우선 행동을 연습할 때 참고할 학습입니다. 기관의 도구·자료 사용 승인은 담당자와 별도로 확인하세요.' : '전체 학습 목록에서 필요한 자료를 선택해 주세요.');
}
