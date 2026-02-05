require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// File upload config (10MB max)
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// ===============================
// PDF TEXT EXTRACTION (Node 24 safe)
// ===============================
async function extractTextFromPDF(buffer) {
  // Dynamic import for ESM module
  const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
  });

  const pdfDoc = await loadingTask.promise;
  let text = "";

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();

    text += content.items.map(item => item.str).join(" ") + "\n";
  }

  return text;
}


// ===============================
// API ROUTE
// ===============================
app.post("/resume/score", upload.single("resume"), async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No resume uploaded." });
    }

    if (!jobDescription) {
      return res.status(400).json({ error: "Job description required." });
    }

    // Extract PDF text
    let resumeText;
    try {
      resumeText = await extractTextFromPDF(req.file.buffer);
    } catch (err) {
      console.error("PDF parsing error:", err);
      return res.status(400).json({
        error: "Invalid or unsupported PDF file",
      });
    }

    // Gemini AI
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `
Evaluate this resume against the job description.

Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY valid JSON:

{
  "matchScore": number,
  "matchedSkills": [],
  "missingSkills": [],
  "recommendations": []
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    let text = response.text().replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
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


// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 9393;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
