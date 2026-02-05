require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');

const app = express();
app.use(cors());

const upload = multer(); // Stores file in memory temporarily
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/resume/score', upload.single('resume'), async (req, res) => {
    try {
        const { jobDescription } = req.body;
        const resumeFile = req.file;

        if (!resumeFile) return res.status(400).send("No resume uploaded.");

        // 1. Convert PDF Buffer to Text
        const pdfData = await pdfParse(resumeFile.buffer);
        const resumeText = pdfData.text;

        // 2. Prepare the AI
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 3. The Prompt (Strict JSON Format)
        const prompt = `
            Evaluate this resume against the job description.
            Resume: ${resumeText}
            JD: ${jobDescription}

            Return ONLY a JSON object with this exact structure:
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
        
        // 4. Send the result back to your React Frontend
        res.json(JSON.parse(text));

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to analyze resume" });
    }
});

app.listen(9393, () => console.log("Server running on port 9393"));