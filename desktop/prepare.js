// Copies the web page into the app folder before running or packaging.
// The desktop app saves on this computer, so the save note says so.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'public', 'time-timer.html');
const outDir = path.join(__dirname, 'app');
fs.mkdirSync(outDir, { recursive: true });
const html = fs.readFileSync(src, 'utf8').replace(/이 브라우저에 자동 저장/g, '이 컴퓨터에 자동 저장');
fs.writeFileSync(path.join(outDir, 'index.html'), html);
// Supabase client used when the page is set up for sync across devices
fs.cpSync(path.join(__dirname, '..', 'public', 'vendor'), path.join(outDir, 'vendor'), { recursive: true });
console.log('app/index.html updated from public/time-timer.html');
