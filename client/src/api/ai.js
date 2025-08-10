import axios from "axios";

export async function getSummary(text) {
  const res = await axios.post("/api/ai/summarize", { text });
  return res.data.summary;
}

