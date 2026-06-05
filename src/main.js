const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const { randomUUID } = require('crypto');

const STORE_FILE = 'tasks.json';

let mainWindow;

function seedTasks() {
  const now = new Date().toISOString();
  return [
    {
      id: randomUUID(),
      title: '整理今天最重要的三件事',
      notes: '把注意力放在能推进结果的任务上。',
      project: 'Today',
      dueDate: new Date().toISOString().slice(0, 10),
      priority: 'q1',
      completed: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: randomUUID(),
      title: '给待办事项加一个清晰的截止时间',
      notes: '',
      project: 'Planning',
      dueDate: '',
      priority: 'q2',
      completed: false,
      createdAt: now,
      updatedAt: now
    }
  ];
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 1120,
    minHeight: 760,
    title: 'Donezo',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 18 },
    backgroundColor: '#eef0f3',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

function storePath() {
  return path.join(app.getPath('userData'), STORE_FILE);
}

async function ensureStore() {
  const file = storePath();
  try {
    await fs.access(file);
  } catch {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(seedTasks(), null, 2));
  }
}

async function readTasks() {
  await ensureStore();
  const file = storePath();
  let raw = '';

  try {
    raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    const backupPath = path.join(
      path.dirname(file),
      `tasks.corrupt-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );

    try {
      if (raw) {
        await fs.writeFile(backupPath, raw);
      }
    } catch {
      // Ignore backup failures and restore a fresh store.
    }

    const fallbackTasks = seedTasks();
    await fs.writeFile(file, JSON.stringify(fallbackTasks, null, 2));
    return fallbackTasks;
  }
}

async function writeTasks(tasks) {
  await fs.writeFile(storePath(), JSON.stringify(tasks, null, 2));
  return tasks;
}

ipcMain.handle('tasks:list', readTasks);

ipcMain.handle('tasks:save', async (_event, tasks) => {
  if (!Array.isArray(tasks)) {
    throw new Error('Invalid task list');
  }

  return writeTasks(tasks);
});

ipcMain.handle('tasks:storePath', () => storePath());

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
