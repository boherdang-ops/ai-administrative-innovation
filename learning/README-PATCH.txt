Learning Hub v0.8.0 — Public Site CMS Sync

변경 범위: 공개 Learning Hub 파일만 수정. admin/ CMS 파일 및 기존 Portfolio는 변경하지 않음.

동작:
1) 기존 6x24 정적 Framework를 안전한 fallback으로 유지.
2) Supabase에서 active Track과 status=public 콘텐츠만 anon 권한으로 읽음.
3) 기존 콘텐츠가 게시되면 CMS 제목/설명/학습내용/학습자산/외부자료/연결 정보를 공개 페이지에 덮어씀.
4) 새 Track은 공개 Track map에 추가되고, 새 콘텐츠는 status=public일 때 공개 사이트에 추가됨.
5) Supabase 조회 실패 시 기존 정적 사이트가 그대로 작동함.
6) 기존 v0.6.4 CMS UI 및 기존 Portfolio는 변경하지 않음.

주의:
- 기존 24개 Framework 항목은 navigation shell로 남음. draft/hidden인 CMS 상세 데이터는 공개 API로 노출되지 않고 정적 placeholder가 유지됨.
