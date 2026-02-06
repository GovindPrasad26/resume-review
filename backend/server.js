require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

/* =====================================
   FILE UPLOAD CONFIG
===================================== */
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/* =====================================
   GEMINI SETUP + API KEY TEST
===================================== */
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing in .env file");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Test API key on startup
async function testGeminiKey() {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-002", // ✅ stable working model
    });

    const result = await model.generateContent("Say hello in one word.");
    const text = result.response.text();

    console.log("✅ Gemini API key working!");
    console.log("Test response:", text);
  } catch (err) {
    console.error("❌ Gemini API key FAILED:");
    console.error(err.message);
  }
}

/* =====================================
   PDF TEXT EXTRACTION (Node 24 safe)
===================================== */
async function extractTextFromPDF(buffer) {
  try {
    const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      standardFontDataUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/standard_fonts/",
    });

    const pdfDoc = await loadingTask.promise;
    let text = "";

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();

      text += content.items.map((item) => item.str).join(" ") + "\n";
    }

    return text.slice(0, 15000);
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to parse PDF");
  }
}

/* =====================================
   RESUME SCORING API
===================================== */
app.post("/resume/score", upload.single("resume"), async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No resume uploaded." });
    }

    if (!jobDescription) {
      return res.status(400).json({ error: "Job description required." });
    }

    const resumeText = await extractTextFromPDF(req.file.buffer);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-002",
    });

    const prompt = `
You are an expert ATS resume evaluator.

Evaluate the resume against the job description.

Return ONLY valid JSON.

Resume:
${resumeText}

Job Description:
${jobDescription}

{
  "matchScore": 0-100,
  "matchedSkills": ["skill"],
  "missingSkills": ["skill"],
  "recommendations": ["tip"]
}
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().replace(/```json|```/g, "").trim();

    let parsed;

    try {
      parsed = JSON.parse(response);
    } catch {
      console.error("Invalid JSON from AI:", response);
      return res.status(500).json({
        error: "AI returned invalid JSON",
      });
    }

    res.json(parsed);
  } catch (error) {
    console.error("Server Error:", error);

    res.status(500).json({
      error: "Analysis failed",
      details: error.message,
    });
  }
});

/* =====================================
   HEALTH CHECK
===================================== */
app.get("/", (req, res) => {
  res.send("Resume scoring API running 🚀");
});

/* =====================================
   START SERVER
===================================== */
console.log("API KEY:", process.env.GEMINI_API_KEY);

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`✅ Server running on port ${PORT}`);

  // 🔥 test API key automatically
  await testGeminiKey();
});
