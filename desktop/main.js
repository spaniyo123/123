// Desktop wrapper for the timer page (public/time-timer.html).
// The page runs offline and keeps its data in this app's own storage.
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createMain() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 380,
    title: '빨간 원판 타이머',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true }
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));

  // "+ 타이머 추가" opens the same page as a small always-on-top timer window;
  // any other link goes to the default browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('file:')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 400,
          height: 780,
          autoHideMenuBar: true,
          alwaysOnTop: true,
          title: '추가 타이머',
          webPreferences: { contextIsolation: true, sandbox: true }
        }
      };
    }
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

// One running copy: opening the app again focuses the existing window.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [w] = BrowserWindow.getAllWindows();
    if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
  });
  app.whenReady().then(createMain);
  app.on('window-all-closed', () => app.quit());
}
