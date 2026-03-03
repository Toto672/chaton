import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getDb } from './db/index.js'
import { getWindowBounds, saveWindowBounds } from './db/repos/settings.js'
import { registerWorkspaceIpc } from './ipc/workspace.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)

function createWindow() {
  const db = getDb()
  const initialBounds = getWindowBounds(db)

  const win = new BrowserWindow({
    x: initialBounds.x,
    y: initialBounds.y,
    width: initialBounds.width,
    height: initialBounds.height,
    minWidth: 1200,
    minHeight: 780,
    frame: true,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#f5f5f7',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  let saveTimeout: NodeJS.Timeout | null = null
  const scheduleBoundsSave = () => {
    if (win.isDestroyed()) {
      return
    }

    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    saveTimeout = setTimeout(() => {
      if (win.isDestroyed() || win.isMinimized() || win.isMaximized()) {
        return
      }

      saveWindowBounds(db, win.getBounds())
    }, 200)
  }

  win.on('move', scheduleBoundsSave)
  win.on('resize', scheduleBoundsSave)
  win.on('close', () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    if (!win.isMinimized() && !win.isMaximized()) {
      saveWindowBounds(db, win.getBounds())
    }
  })
}

app.whenReady().then(() => {
  registerWorkspaceIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
