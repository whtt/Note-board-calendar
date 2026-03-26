const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 系统的配置文件，用来“记住”你上次设置的存档路径
const CONFIG_FILE = path.join(__dirname, 'os_config.json');
// 默认的数据存档路径
let dataFilePath = path.join(__dirname, 'os_data.json'); 

// 启动时读取配置
if (fs.existsSync(CONFIG_FILE)) {
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        if (config.savePath) dataFilePath = config.savePath;
    } catch (e) {
        console.error('读取配置文件失败:', e);
    }
}

// 辅助函数：确保目标文件夹存在
const ensureDir = (filePath) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// 【接口 1】获取当前数据
app.get('/api/os-data', (req, res) => {
    if (!fs.existsSync(dataFilePath)) {
        return res.json({ tasks: [], notes: [] });
    }
    try {
        const data = fs.readFileSync(dataFilePath, 'utf-8');
        res.json(JSON.parse(data));
    } catch (e) {
        res.status(500).json({ error: '读取数据失败' });
    }
});

// 【接口 2】保存数据
app.post('/api/os-data', (req, res) => {
    try {
        ensureDir(dataFilePath);
        fs.writeFileSync(dataFilePath, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '保存数据失败' });
    }
});

// 【接口 3】获取当前的物理路径
app.get('/api/os-path', (req, res) => {
    res.json({ path: dataFilePath });
});

// 【接口 4】修改物理路径
app.post('/api/os-path', (req, res) => {
    const { newPath } = req.body;
    if (newPath) {
        dataFilePath = newPath;
        // 把新路径写入 config 文件，下次重启 Node 服务就不会丢了
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({ savePath: dataFilePath }));
        res.json({ success: true, path: dataFilePath });
    } else {
        res.status(400).json({ error: '路径不能为空' });
    }
});

app.listen(3000, () => {
    console.log('🚀 极客 OS 后端已启动 (端口: 3000)');
    console.log(`💾 当前存档路径: ${dataFilePath}`);
});