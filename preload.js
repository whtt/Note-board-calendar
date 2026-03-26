// MyCalendar/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveData: (moduleName, data) => ipcRenderer.invoke('save-data', moduleName, data),
  loadData: (moduleName) => ipcRenderer.invoke('load-data', moduleName),
  
  getStoragePath: () => ipcRenderer.invoke('get-storage-path'),
  changeStoragePath: () => ipcRenderer.invoke('change-storage-path'),
  
  // 新增：读取外部 JSON 文件的桥梁
  importJson: () => ipcRenderer.invoke('import-json')
});