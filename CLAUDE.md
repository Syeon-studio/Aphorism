# Overload: 감정의 풍경 — 전시 웹사이트

아포리즘 Aphorism 단체전 웹사이트. 공개 사이트 + 작가가 고유 링크로 자기 페이지를 고치는 편집 화면.
상세 요구사항은 기획서(저장소 밖, 2026-11-25 작성)가 원본이고, 이 파일은 그 요약과 작업 규칙이다.

@AGENTS.md

## 전시 정보 (원본: `src/lib/exhibition.ts`)

- 기간: 2026-12-22(화) ~ 12-31(목), 매일 10:00–18:00, 첫날은 14:00 오픈(오프닝), 12-25(금) 휴관
- 장소: 서울 강남구 역삼로7길 16 역삼1동복합문화센터 1층 · 입장료 무료 · 한국어 단일
- 참여 작가 8명: 김미내, 김태현, 맹욱재, 박하영, 시언, 이민영, 이철영, 필독
- 마감: 11-30 1차 완성, 12-18 최종 완성. 작가 수정 마감은 오프닝 전(예: 12-21 18:00, 관리자 조정)

## 기술 스택

- Next.js 16 (App Router, `cacheComponents` + `partialPrefetching`) + TypeScript + Tailwind CSS v4
- 2단계부터: Supabase (Postgres + Storage, Auth·RLS 미사용), dnd-kit, browser-image-compression
- 배포: Vercel. 도메인 미정 → URL은 항상 `getSiteUrl()`(`src/lib/site.ts`)로 만든다. 하드코딩 금지.
- Next.js 16은 학습 데이터와 API가 다를 수 있다. 코드 쓰기 전에 `node_modules/next/dist/docs/`의 해당 문서를 확인한다.

## 명령어

```bash
npm run dev     # 개발 서버 (http://localhost:3000)
npm run lint
npm run typecheck  # 라우트 타입 생성 + tsc
npm run build   # 커밋 전 통과 확인
```

## 구조

```
src/app/            라우트. robots.ts, sitemap.ts 포함
src/components/     Footer, WorkCredit, (예정) Poster/ 독립 폴더
src/lib/            exhibition.ts(전시 정보), credit.ts(크레딧 형식), site.ts(사이트 URL)
src/types/          content.ts — 작가·작품 JSON 타입 (기획서 4장)
data/               1단계용 sample.json (예정)
```

## 개발 단계 (기획서 6장)

1. 공개 사이트 — `data/sample.json`(작가 8명 실명 + 더미 소개·작품 4점)으로 메인·상세·라이트박스. 포스터는 임시 SVG  ← 현재
2. DB 연결 — Supabase 테이블(settings, artists)·Storage, 공개 사이트가 published 읽기
3. 작가 편집 화면 `/edit/[token]` — 정보·작품 입력, 순서 변경, 이미지 업로드, 임시저장·완료
4. 관리자 화면 `/admin/[admin_token]` — 작가 추가·토큰, 전시 정보, 마감 일시, 미공개 변경, 백업 복구
5. 마감 — 최종 포스터, `public/og.png`(1200×630), 실기기 테스트, 성능 점검

## 디자인·구현 규칙

- 브레이크포인트: 기본 = 모바일(<768), `tablet:`(≥768), `desktop:`(≥1200). Tailwind 기본 sm/md/lg/xl은 꺼져 있다.
- 모바일 우선. 공개·편집 화면 모두 360px 폭에서 깨지지 않을 것.
- 메인 작가 그리드 2/4/4열, 작가 상세 메이슨리 2/3/3열(JS로 순서대로 가장 짧은 열에 배치, 저장된 width/height로 자리 확보, 크롭 없음).
- 포스터는 SVG 코드, `components/Poster/`에 분리, 3구도(데스크톱/태블릿/모바일), `aria-label` 필수.
- 이미지: `next/image`, 썸네일(600px)만 목록에서 로드. 모든 작품 이미지 alt = 작품 제목.
- `prefers-reduced-motion`이면 애니메이션 끔 (globals.css에 전역 처리 있음).
- 편집·관리 페이지는 `robots: { index: false }` 메타데이터를 건다 (헤더 noindex도 next.config.ts에 있음).
- 브라우저는 DB에 직접 쓰지 않는다. 저장은 Route Handler 경유, 서버에서 토큰↔작가 일치만 확인.

## 저작권·크레딧

- 저작권자 표기: **아포리즘 Aphorism** (`COPYRIGHT_HOLDER`)
- LICENSE: 소스 코드는 MIT, 작품·사진·전시 텍스트·포스터 디자인·`data/`·`public/`은 All rights reserved
  (작품 = 각 작가, 사진 = 각 촬영자).
- 푸터 문구 (`src/components/Footer.tsx`, 모든 페이지 공통):
  > © 2026 아포리즘 Aphorism. All rights reserved.
  > 작품 이미지의 저작권은 각 작가에게, 작품 사진의 저작권은 각 촬영자에게 있습니다. 사전 허락 없이 복제·배포하거나 AI 학습에 이용할 수 없습니다.
- 작품 크레딧은 반드시 `src/lib/credit.ts`(`getCreditParts`, `formatCreditLine`)와 `WorkCredit` 컴포넌트로만 만든다.
  - 캡션(여러 줄): *제목*(기울임) / 년도, 재료, 크기 / 기타 정보 / 사진: 촬영자
  - 한 줄: `작가명, 〈제목〉, 년도, 재료, 크기, 기타. 사진: 촬영자`
  - 빈 항목은 구분자째 생략. 촬영자는 작품별 `photo_credit` 필드(기획서 이후 추가, 선택).

## 크롤러 정책 (`src/app/robots.ts`)

- AI **학습용** 크롤러만 차단(GPTBot, ClaudeBot, Google-Extended, CCBot 등). 일반 검색엔진과 AI 검색·사용자 요청형 봇은 허용.
- 링크 미리보기 봇(facebookexternalhit, kakaotalk-scrap, Twitterbot)은 절대 차단하지 않는다 — 카카오톡·인스타 공유가 깨진다.
- `/edit/`, `/admin/`, `/api/`는 모든 봇에 Disallow. 보조로 모든 응답에 `X-Robots-Tag: noai, noimageai`.

## 보안 — 이 저장소는 Public이다

- 커밋 금지: `.env*`(단 `.env.example`은 변수 이름만), Supabase service key, `ADMIN_TOKEN`, 작가 편집 토큰·편집 링크,
  작가 개인 연락처(전화번호·개인 이메일), 미공개 작품 원본 파일, 내부 회의 메모.
- 비밀값은 `.env.local`(로컬)과 Vercel 환경변수에만. 코드에는 `process.env.X`로만 참조.
- 서버 전용 값에 `NEXT_PUBLIC_` 접두사를 붙이지 않는다. service key를 쓰는 모듈은 `import "server-only"`.
- 시드·테스트 데이터에 실제 토큰을 넣지 않는다. 토큰은 런타임에 생성(24자 이상 랜덤).
- 커밋 전 `git diff --cached`로 비밀값이 섞이지 않았는지 확인한다.

## 미정 사항

- 최종 포스터 디자인·3구도 시안 / 연락처(이메일·인스타그램) / 수정 마감 일시
- 작품당 사진 1장으로 충분한지 / 전시 종료 후 아카이브 유지 여부 / 최종 폰트(현재 Noto Sans KR 임시)
