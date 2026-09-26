# 빨간 원판 타이머 — Windows 데스크톱 앱

`public/time-timer.html` 페이지를 [Electron](https://www.electronjs.org/)으로 감싼 Windows 프로그램입니다.
인터넷 없이 동작하고, 할 일·기록은 이 컴퓨터에 저장됩니다.
"+ 타이머 추가"는 항상 위에 떠 있는 작은 창으로 열립니다.

## 빌드 (Windows용 exe 만들기)

Node.js 20 이상이 필요합니다.

```bash
cd desktop
npm install
npm run build:win
```

결과: `desktop/dist/RedDiscTimer-win32-x64/RedDiscTimer.exe`
(폴더째 옮겨야 실행됩니다. exe 하나만 복사하면 동작하지 않습니다.)

## 개발 중 실행

```bash
npm start
```

`npm run prepare-app`이 매번 `public/time-timer.html`을 `desktop/app/index.html`로 복사하므로,
웹 페이지를 고친 뒤 다시 빌드하면 앱에도 반영됩니다.
