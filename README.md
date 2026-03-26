# WebClock

가벼운 집중용 웹 앱입니다. 시계, 메인 포커스, 유튜브 재생목록을 한 화면에서 쓰고, 번호 기반 공유 워크스페이스로 여러 기기에서 이어서 사용할 수 있습니다.

## Features

- 실시간 디지털 시계
- 오늘의 메인 포커스 입력
- 유튜브 재생목록 저장 및 반복 재생
- `localStorage` 기반 로컬 유지
- 개인 번호 기반 공유 워크스페이스
- Supabase REST 기반 기기 간 동기화

## Env Setup

브라우저는 `.env`를 직접 읽지 못해서, 실행 전에 `.env` 또는 배포 환경변수를 브라우저용 설정 파일로 변환합니다.

1. `.env.example`을 복사해서 `.env.local` 또는 `.env`를 만듭니다.
2. 값을 채웁니다.

```bash
cp .env.example .env.local
```

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_TABLE=shared_workspaces
```

3. 설정 파일을 생성합니다.

```bash
npm run sync-env
```

생성 결과물은 `src/js/runtime-config.js`이고, git에는 포함되지 않습니다.

Vercel에서는 `Environment Variables`에 넣은 값도 같은 스크립트가 읽습니다.

## Run

```bash
npm run dev
```

기본 포트는 `3000`이고, `http://localhost:3000`에서 확인할 수 있습니다.
이미 사용 중이면 `PORT=3001 npm run dev`처럼 다른 포트로 실행하면 됩니다.

직접 정적 서버를 띄우고 싶다면 아래처럼 실행해도 됩니다.

```bash
npm run sync-env
python3 -m http.server 3000
```

## Vercel

Vercel 배포는 `npm run build`로 `public/` 폴더를 생성한 뒤 그 폴더를 배포합니다. 프로젝트 루트에 있는 [vercel.json](/Users/yongsoolee/Documents/GitHub/WebClock/vercel.json)에서 Output Directory를 `public`으로 고정해 두었습니다.

## Supabase

테이블과 정책은 [shared_workspaces.sql](/Users/yongsoolee/Documents/GitHub/WebClock/supabase/shared_workspaces.sql)에 있습니다. Supabase SQL Editor에서 한 번 실행하면 됩니다.
