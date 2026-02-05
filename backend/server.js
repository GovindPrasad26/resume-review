require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse'); // Stable version 1.1.1
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');

const app = express();
app.use(cors());

const upload = multer();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/resume/score', upload.single('resume'), async (req, res) => {
    try {
        const { jobDescription } = req.body;
        if (!req.file) return res.status(400).send("No resume uploaded.");

        // 1. Convert PDF Buffer to Text
        const pdfData = await pdf(req.file.buffer);
        const resumeText = pdfData.text;

        // 2. Prepare the AI
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Evaluate this resume against the job description.
            Resume: ${resumeText}
            JD: ${jobDescription}

            Return ONLY a JSON object:
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
        
        res.json(JSON.parse(text));

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Analysis failed", details: error.message });
    }
});

const PORT = process.env.PORT || 9393;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});