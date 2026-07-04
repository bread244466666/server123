const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const app = express();

// 優先使用 Render 分配的動態 Port，本地測試預設使用 3000
const PORT = process.env.PORT || 3000;

// 從 Render 後台的 Environment 安全讀取連線字串
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "search_recorder";
const COLLECTION_NAME = "history";

let dbCollection;

// 初始化 MongoDB 連線
async function connectDB() {
  if (!MONGO_URI) {
    console.error("❌ 錯誤：找不到環境變數 MONGO_URI，請至 Render 後台設定。");
    return;
  }
  
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    dbCollection = db.collection(COLLECTION_NAME);
    console.log("🟢 成功連線至 MongoDB Atlas 雲端資料庫");
  } catch (error) {
    console.error("❌ MongoDB 連線失敗：", error);
  }
}
connectDB();

// 啟用跨網域與 JSON 解析中間件
app.use(cors());
app.use(express.json());

// 1. 接收資料並直接寫入 MongoDB (無 API Key 驗證)
app.post('/api/save-search', async (req, res) => {
  const { query, timestamp } = req.body;
  
  if (!query) {
    return res.status(400).json({ success: false, message: 'Query is required' });
  }

  // 擷取請求來源的真實 IP 位址
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userIp = rawIp ? rawIp.split(',')[0].trim() : "Unknown";

  const newLog = { 
    query, 
    timestamp,
    ip: userIp 
  };
  
  try {
    if (dbCollection) {
      await dbCollection.insertOne(newLog);
      console.log(`[SERVER] Saved to MongoDB: "${query}" from IP: ${userIp}`);
      res.status(200).json({ success: true, message: 'Saved successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Database not ready' });
    }
  } catch (error) {
    console.error("寫入資料庫失敗：", error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// 2. 從 MongoDB 讀取歷史紀錄
app.get('/api/view-history', async (req, res) => {
  try {
    if (dbCollection) {
      // 依時間倒序讀取最新 100 筆資料
      const history = await dbCollection.find({}).sort({ _id: -1 }).limit(100).toArray();
      res.json(history);
    } else {
      res.status(500).json({ success: false, message: 'Database not ready' });
    }
  } catch (error) {
    console.error("讀取資料庫失敗：", error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// 根目錄預設顯示
app.get('/', (req, res) => {
  res.send('Server is running with MongoDB Atlas backend.');
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
