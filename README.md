# WebClock

간단한 탁상용 웹 앱입니다.  
시계, 오늘의 할 일, 메모, 포모도로 타이머를 한 화면에서 사용할 수 있습니다.

## Features

- 실시간 디지털 시계
- 오늘의 목표 입력
- 오늘 할 일 추가, 완료, 삭제
- 현재 위치 기반 날씨 자동 조회
- 메모 자동 저장
- 포모도로 타이머
- `localStorage` 기반 데이터 유지

## Project Structure

```text
.
├── index.html
├── package.json
├── README.md
└── src
    ├── js
    │   ├── app.js
    │   ├── config.js
    │   ├── dom.js
    │   ├── state.js
    │   └── features
    │       ├── clock.js
    │       ├── weather.js
    │       ├── notes.js
    │       ├── pomodoro.js
    │       └── todos.js
    └── styles
        ├── main.css
        ├── base.css
        ├── layout.css
        ├── components.css
        └── responsive.css
```

## Run

이 프로젝트는 별도 빌드 없이 브라우저에서 바로 열 수 있습니다.

```bash
open index.html
```

또는 VS Code Live Server 같은 정적 서버로 실행해도 됩니다.

## Notes

- 데이터는 브라우저의 `localStorage`에 저장됩니다.
- 현재는 순수 HTML, CSS, JavaScript로 구성되어 있습니다.
