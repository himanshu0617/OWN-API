// Basic Express API for news with MongoDB
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inshortsclone';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// News schema
const newsSchema = new mongoose.Schema({
  title: String,
  summary: String,
  image_url: String,
  date: String, // YYYY-MM-DD
  source_url: String,
  category: String,
});
const News = mongoose.model('News', newsSchema);

// API key middleware
const API_KEY = process.env.API_KEY || 'api.mrmshorts.com';
function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (key === API_KEY) {
    return next();
  }
  return res.status(401).json({ error: 'Invalid or missing API key' });
}

// GET /news?date=YYYY-MM-DD&category=...&page=1&pageSize=10
app.get('/news', async (req, res) => {
  const { date, category, page = 1, pageSize = 10 } = req.query;
  const filter = {};
  if (date) filter.date = date;
  if (category && category !== 'All') filter.category = category;
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  try {
    const news = await News.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(pageSize));
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /news (for adding news)
app.post('/news', requireApiKey, async (req, res) => {
  try {
    const news = new News(req.body);
    await news.save();
    res.status(201).json(news);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
