import { summarizeText } from "../utils/summarizer.js";

export const summarize = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required for summarization" });
    }
    const summary = await summarizeText(text);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: "Server error during summarization" });
  }
};
