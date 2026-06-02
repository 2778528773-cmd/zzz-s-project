const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('todoApi', {
  listTasks: () => ipcRenderer.invoke('tasks:list'),
  saveTasks: (tasks) => ipcRenderer.invoke('tasks:save', tasks),
  getStorePath: () => ipcRenderer.invoke('tasks:storePath')
});
