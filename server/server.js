// server.js
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/ai", aiRoutes);

// Debug keys
console.log("✅ GEMINI_API_KEY loaded:", !!process.env.GEMINI_API_KEY);
console.log("✅ NEWS_API_KEY loaded:", !!process.env.NEWS_API_KEY);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ===== GET /api/news =====
app.get('/api/news', async (req, res) => {
  try {
    const query = req.query.query?.trim() || 'latest';
    let url;

    if (query.toLowerCase() === 'latest') {
      url = `https://newsapi.org/v2/top-headlines?country=us&pageSize=30&apiKey=${process.env.NEWS_API_KEY}`;
    } else {
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=30&sortBy=publishedAt&language=en&apiKey=${process.env.NEWS_API_KEY}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'ok') {
      throw new Error(data.message || 'Failed to fetch news');
    }

    // Group by source
    const grouped = Object.values(
      data.articles.reduce((acc, article) => {
        const sourceName = article.source?.name || 'Unknown';
        if (!acc[sourceName]) {
          acc[sourceName] = { source: sourceName, articles: [] };
        }
        acc[sourceName].articles.push(article);
        return acc;
      }, {})
    );

    res.json(grouped);
  } catch (error) {
    console.error("❌ NewsAPI error:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// ===== POST /api/summarise =====
app.post('/api/summarise', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });



    const prompt = `Summarise the following news article in 2-3 concise sentences:\n\n${text}`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    res.json({ summary });
  } catch (error) {
    console.error("❌ Gemini summarise error:", error);
    res.status(500).json({ error: "Failed to summarise" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
