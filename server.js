
require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const CaptionEngine = require("./captionEngine");
const captionEngine = new CaptionEngine();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ====== TRANSLATOR (Azure Translator) ======
const TRANSLATOR_KEY = process.env.TRANSLATOR_KEY;
const REGION = process.env.AZURE_REGION || "koreacentral";

// ====== AZURE OPENAI (tầng AI correction) ======
const AOAI_ENDPOINT = process.env.AOAI_ENDPOINT; // ví dụ: https://ten-resource.openai.azure.com
const AOAI_API_KEY = process.env.AOAI_API_KEY;
const AOAI_DEPLOYMENT = process.env.AOAI_DEPLOYMENT; // tên deployment bạn đặt trong Azure OpenAI Studio

const CORRECTION_SYSTEM_PROMPT = `Bạn là trợ lý sửa lỗi nhận diện giọng nói (STT) tiếng Hàn cho các buổi họp an toàn công trường xây dựng (TBM - Tool Box Meeting).
STT thường nghe nhầm thuật ngữ chuyên ngành thành từ phổ biến nghe gần giống.
Các thuật ngữ thường gặp: TBM, 안전통로, 엘리베이터홀, 비계, 크레인, 화재, 안전구호, 통행로.
Nhiệm vụ: nếu câu có khả năng chứa lỗi nhận diện do nghe nhầm từ chuyên ngành thành từ phổ biến, hãy sửa lại cho đúng ngữ cảnh công trường.
Nếu câu đã hợp lý, đúng ngữ cảnh, hoặc không rõ cần sửa gì, hãy giữ nguyên, đừng tự suy diễn thêm.
CHỈ trả về đúng câu kết quả (đã sửa hoặc giữ nguyên). Không thêm giải thích, không thêm dấu ngoặc kép, không thêm tiền tố.`;

app.post("/translate", async (req, res) => {
  try {
    const text = req.body.text;
    const targets = req.body.targets || [];

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    if (!targets.length) {
      return res.json([]);
    }

    const allowedTargets = ["vi", "en", "zh-Hans"];

    const safeTargets = targets.filter(lang =>
      allowedTargets.includes(lang)
    );

    if (!safeTargets.length) {
      return res.json([]);
    }

    const toQuery = safeTargets
      .map(lang => `to=${encodeURIComponent(lang)}`)
      .join("&");

    const response = await axios({
      baseURL: "https://api.cognitive.microsofttranslator.com",
      url: `/translate?api-version=3.0&from=ko&${toQuery}`,
      method: "post",
      headers: {
        "Ocp-Apim-Subscription-Key": TRANSLATOR_KEY,
        "Ocp-Apim-Subscription-Region": REGION,
        "Content-Type": "application/json",
      },
      data: [{ text }],
      responseType: "json",
    });

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      error: "Translate failed",
      detail: error.response?.data || error.message,
    });
  }
});

// ====== AI CORRECTION LAYER (Azure OpenAI) ======
app.post("/correct", async (req, res) => {
  const originalText = req.body.text;
  const context = req.body.context; // "TBM" | "SAFETY" | "GENERAL" (từ captionEngine.detectContext)

  if (!originalText) {
    return res.status(400).json({ error: "No text provided" });
  }

  // Nếu chưa cấu hình Azure OpenAI, fail-safe: trả lại nguyên văn, không làm gãy pipeline
  if (!AOAI_ENDPOINT || !AOAI_API_KEY || !AOAI_DEPLOYMENT) {
    console.warn("Azure OpenAI chưa được cấu hình trong .env — bỏ qua bước correction.");
    return res.json({ corrected: originalText });
  }

  try {
    const userContent = context
      ? `[Ngữ cảnh: ${context}]\n${originalText}`
      : originalText;

    const url = `${AOAI_ENDPOINT}/openai/v1/chat/completions?api-version=v1`;

    const response = await axios({
      url,
      method: "post",
      headers: {
        "api-key": AOAI_API_KEY,
        "Content-Type": "application/json",
      },
      data: {
        model: AOAI_DEPLOYMENT,
        messages: [
          { role: "system", content: CORRECTION_SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0,
        max_tokens: 200,
      },
    });

    const corrected =
      response.data?.choices?.[0]?.message?.content?.trim() || originalText;

    res.json({ corrected });
  } catch (error) {
    console.error("Correction failed:", error.response?.data || error.message);
    // fail-safe: nếu AI correction lỗi, vẫn trả lại text gốc để pipeline không bị gãy
    res.json({ corrected: originalText });
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
  console.log("Open STT: http://localhost:3000/stt.html");
});