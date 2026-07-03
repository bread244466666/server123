const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let globalSearchDatabase = [];

// 接收來自擴充功能的資料
app.post('/api/save-search', (req, res) => {
  const { query, timestamp } = req.body;
  
  if (!query) {
    return res.status(400).json({ success: false, message: 'Query is required' });
  }

  const newLog = { query, timestamp };
  globalSearchDatabase.push(newLog);
  
  console.log(`[SERVER] Received query: "${query}"`);
  
  res.status(200).json({ success: true, message: 'Saved!' });
});

// 查看目前儲存的資料
app.get('/api/view-history', (req, res) => {
  res.json(globalSearchDatabase);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
