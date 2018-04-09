import { app, dialog, screen, BrowserWindow, Menu, ipcMain } from "electron";
import * as Path from "path";
import * as Url from "url";
import * as tar from "tar-fs";
import * as Fs from "fs";

const sander = require("@marionebl/sander");
const log = require("electron-log");

require("electron-debug")({ enabled: true });
const isDevelopment = process.env.NODE_ENV !== "production";

let mainWindow: Electron.BrowserWindow | null;
let unpacking = false;

async function createWindow() {
  try {
    const installExtension = require("electron-devtools-installer").default;
    const { REACT_DEVELOPER_TOOLS } = require("electron-devtools-installer");
    installExtension(REACT_DEVELOPER_TOOLS);
  } catch (err) {
    console.warn(err);
  }

  const {
    width = 1280,
    height = 800
  } = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 600,
    minHeight: 380,
    titleBarStyle: "hiddenInset",
    title: "patternplate"
  });

  if (isDevelopment && process.env.ELECTRON_WEBPACK_WDS_PORT) {
    mainWindow.loadURL(
      `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`
    );
  } else {
    mainWindow.loadURL(
      Url.format({
        pathname: Path.join(__dirname, "index.html"),
        protocol: "file",
        slashes: true
      })
    );
  }

  // Open the DevTools.
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

function createMenu() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "patternplate",
        submenu: [
          {
            label: "About patternplate",
            selector: "orderFrontStandardAboutPanel:"
          } as any,
          {
            label: "Check for updates ..."
          },
          {
            type: "separator"
          },
          {
            label: "Hide",
            accelerator: "Command+H",
            click: () => {
              const win = BrowserWindow.getFocusedWindow();
              if (win) {
                win.hide();
              }
            }
          },
          {
            type: "separator"
          },
          {
            label: "Quit patternplate",
            accelerator: "Command+Q",
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: "Library",
        submenu: [
          {
            label: "New library",
            accelerator: "Command+N",
            click: () => {
              const win = BrowserWindow.getFocusedWindow();
              if (win) {
                win.webContents.send("menu-request-new");
              }
            }
          },
          {
            label: "Open",
            accelerator: "Command+O",
            click: () => openFromFs()
          }
        ]
      },
      {
        label: "Edit",
        submenu: [
          {
            label: "Undo",
            accelerator: "CmdOrCtrl+Z",
            selector: "undo:"
          },
          {
            label: "Redo",
            accelerator: "Shift+CmdOrCtrl+Z",
            selector: "redo:"
          },
          {
            type: "separator"
          },
          {
            label: "Cut",
            accelerator: "CmdOrCtrl+X",
            selector: "cut:"
          },
          {
            label: "Copy",
            accelerator: "CmdOrCtrl+C",
            selector: "copy:"
          },
          {
            label: "Paste",
            accelerator: "CmdOrCtrl+V",
            selector: "paste:"
          },
          {
            label: "Select All",
            accelerator: "CmdOrCtrl+A",
            selector: "selectAll:"
          }
        ]
      }
    ])
  );
}

const openFromFs = () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    dialog.showOpenDialog(
      {
        title: "Open from Disk",
        buttonLabel: "Open Library",
        properties: ["openDirectory"]
      },
      (selectedPaths: string[]) => {
        if (!Array.isArray(selectedPaths)) {
          return;
        }

        const [path] = selectedPaths;

        if (path) {
          win.webContents.send("menu-request-open-from-fs", path);
        }
      }
    );
  }
};

function unpack(from: string, to: string) {
  return new Promise((resolve, reject) => {
    Fs.createReadStream(from)
      .pipe(tar.extract(to))
      .on("finish", () => resolve())
      .on("error", (err: any) => {
        if (err.code === "ENOENT") {
          console.warn(err);
          return;
        }
        reject(err);
      });
  });
}

const unpackModules = async () => {
  const send = (channel: string, payload?: any) => {
    const wins = BrowserWindow.getAllWindows();
    wins.forEach(win => {
      win.webContents.send(channel, payload);
    });
  }

  const sourcePath = process.env.NODE_ENV === "production"
    ? (process as any).resourcesPath
    : Path.join(__dirname, "..", "..");

  const staticTargetPath = Path.join(app.getPath("userData"), "node", "bin");
  await sander.copydir(Path.resolve(sourcePath, "static", "node", "bin")).to(staticTargetPath);

  const archivePath = Path.join(sourcePath, "node_modules.tar");
  const sumPath = Path.join(sourcePath, "node_modules.md5");
  const sourceSum = String(await sander.readFile(sumPath));

  const userData = app.getPath("userData");
  const targetPath = Path.join(userData, "node", "node_modules");
  const targetSumPath = Path.join(userData, "node", "node_modules.md5");
  const hasTargetSum = await sander.exists(targetSumPath);
  const targetSum = hasTargetSum ? String(await sander.readFile(targetSumPath)) : null;

  if (sourceSum === targetSum) {
    send("modules-ready");
    log.warn(`checksums at ${sumPath} and ${targetSumPath} (${targetSum}) match, nothing to copy.`);
    return;
  }

  if (unpacking) {
    return;
  }

  unpacking = true;

  send("modules-start");
  log.warn(`Unpacking from ${archivePath} to ${targetPath} ...`);

  await sander.rimraf(targetPath);

  try {
    await sander.mkdir(targetPath);
    await unpack(archivePath, targetPath);
  } catch (err) {
    console.error(err);
    send("modules-error", err);
    unpacking = false;
    await sander.rimraf(targetSumPath)
      .catch(() => {});
    return;
  }

  send("modules-ready");
  log.warn(`Unpacked to ${targetPath}`);

  await sander.copyFile(sumPath).to(targetSumPath);
  unpacking = false;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  createMenu();
  createWindow();
  ipcMain.on("check-modules", () => unpackModules());
  ipcMain.on("open-from-fs", () => openFromFs());
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!mainWindow) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

if (module.hot) {
  module.hot.accept();
}
