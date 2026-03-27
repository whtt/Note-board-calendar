// MyCalendar/main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 帝国的默认系统配置文件路径 (用来记住用户选择的存储位置)
const CONFIG_FILE = path.join(app.getPath('userData'), 'app_config.json');

// 核心函数：获取当前真正的数据存储目录
function getStorageDir() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      // 如果用户设置了自定义路径，且该路径存在，则使用它
      if (config.customPath && fs.existsSync(config.customPath)) {
        return config.customPath;
      }
    } catch (e) {
      console.error('读取配置失败:', e);
    }
  }
  // 默认路径：AppData
  const defaultDir = path.join(app.getPath('userData'), 'AppData');
  if (!fs.existsSync(defaultDir)) {
    fs.mkdirSync(defaultDir, { recursive: true });
  }
  return defaultDir;
}

// 1. 获取当前存储路径 (供前端 UI 显示)
ipcMain.handle('get-storage-path', async () => {
  return getStorageDir();
});

// 2. 更改存储路径 (呼出系统级文件夹选择框)
ipcMain.handle('change-storage-path', async (event) => {
  const oldDir = getStorageDir();
  
  // 呼出 Windows 文件夹选择器
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: '选择新的数据存储目录 (如 OneDrive/坚果云 等)',
    properties: ['openDirectory', 'createDirectory']
  });

  if (canceled || filePaths.length === 0) {
    return { success: false };
  }

  const newDir = filePaths[0];

  // 避免自己迁自己
  if (oldDir === newDir) return { success: true, path: newDir };

  // === 自动化数据迁移 ===
  try {
    const modules = ['tasks.json', 'notes.json']; // 以后加了词库，直接在这里加名字
    modules.forEach(file => {
      const oldFile = path.join(oldDir, file);
      const newFile = path.join(newDir, file);
      // 如果旧目录有文件，且新目录没有同名文件，则自动搬迁过去
      if (fs.existsSync(oldFile) && !fs.existsSync(newFile)) {
        fs.copyFileSync(oldFile, newFile);
      }
    });

    // 将新路径写入系统配置
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ customPath: newDir }, null, 2), 'utf-8');
    
    return { success: true, path: newDir };
  } catch (err) {
    console.error('数据搬迁失败:', err);
    return { success: false, error: err.message };
  }
});

// ====== 新增：导入 JSON 任务文件 ======
ipcMain.handle('import-json', async () => {
  // 呼出 Windows 原生文件选择器，限制只能选 .json 文件
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: '选择要导入的 JSON 任务文件',
    filters: [{ name: 'JSON 数据文件', extensions: ['json'] }],
    properties: ['openFile']
  });

  if (canceled || filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  try {
    // 读取文件内容并解析为 JSON
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    const data = JSON.parse(content);
    return { success: true, data };
  } catch (err) {
    console.error('导入 JSON 失败:', err);
    return { success: false, error: '文件损坏或格式不是标准 JSON' };
  }
});

// 3. 核心解耦逻辑：根据模块名存取对应 JSON
ipcMain.handle('save-data', async (event, moduleName, data) => {
  const dir = getStorageDir();
  const filePath = path.join(dir, `${moduleName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return { success: true, path: filePath };
});

ipcMain.handle('load-data', async (event, moduleName) => {
  const dir = getStorageDir();
  const filePath = path.join(dir, `${moduleName}.json`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }
  return null; 
});

// ===== 窗口创建逻辑 =====
function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 880,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 💡 核心改造：判断是否是打包后的生产环境
  if (!app.isPackaged) {
    // 开发环境：读取 Vite 本地服务器
    win.loadURL('http://localhost:5173'); 
    // win.webContents.openDevTools(); // 你可以解除注释来打开控制台
  } else {
    // 生产环境：读取 Vue 打包后的 dist 目录下的 index.html
    win.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});