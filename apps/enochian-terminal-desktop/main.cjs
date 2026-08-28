const { app, BrowserWindow, session } = require("electron");
const terminalUrl = "https://www.chanson-a-repondre-uno.scot/enochian-terminal/";
function createWindow() {
  const win = new BrowserWindow({ width: 1440, height: 900, minWidth: 960, minHeight: 640, backgroundColor: "#02070b", title: "ENOCHIAN TERMINAL", webPreferences: { contextIsolation: true, sandbox: true, webSecurity: true } });
  win.removeMenu(); win.loadURL(terminalUrl);
}
app.whenReady().then(() => {
  const allowMidi = (_, permission, callback) => callback(permission === "midi");
  session.defaultSession.setPermissionRequestHandler(allowMidi);
  session.defaultSession.setPermissionCheckHandler((_, permission) => permission === "midi");
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });