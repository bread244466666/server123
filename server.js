const express = require('express');
const cors = require('cors');
const app = express();

// 💡 雲端環境核心：優先使用 Render 分配的動態 Port，本地測試則預設使用 3000
const PORT = process.env.PORT || 3000;

// 啟用 CORS 跨網域套件，允許你的 Chrome 擴充功能連線進來
app.use(cors());
// 允許伺服器解析 JSON 格式的請求主體 (Request Body)
app.use(express.json());

// 用來暫時存放資料的記憶體資料庫 (伺服器重啟時會清空)
let globalSearchDatabase = [];

// 1. 接收來自 Chrome 擴充功能的 POST 請求
app.post('/api/save-search', (req, res) => {
  const { query, timestamp } = req.body;
  
  if (!query) {
    return res.status(400).json({ success: false, message: 'Query is required' });
  }

  // 💡 抓取使用者的真實 IP 位址
  // 在 Render 這種反向代理伺服器後方，真實 IP 會被存在 x-forwarded-for 標頭中
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  // 如果有多個 IP (經由多重代理)，只取第一個主要 IP
  const userIp = rawIp.split(',')[0].trim();

  // 將資料打包成物件
  const newLog = { 
    query, 
    timestamp,
    ip: userIp 
  };
  
  // 存入陣列
  globalSearchDatabase.push(newLog);
  
  // 在 Render 的 Log 日誌中即時印出訊息 (方便除錯)
  console.log(`[SERVER] Received query: "${query}" from IP: ${userIp}`);
  
  res.status(200).json({ success: true, message: 'Saved with IP successfully!' });
});

// 2. 提供一個 GET 介面，讓你直接用網址查看目前存了哪些東西
app.get('/api/view-history', (req, res) => {
  res.json(globalSearchDatabase);
});

// 3. 根目錄預設提示 (當你直接點開 https://...onrender.com 時顯示)
app.get('/', (req, res) => {
  res.send('Search History Recorder Server is running successfully!');
});

// 啟動伺服器監聽
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
