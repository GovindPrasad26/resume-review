require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse'); 
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');

const app = express();
app.use(cors());

const upload = multer();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/resume/score', upload.single('resume'), async (req, res) => {
    try {
        const { jobDescription } = req.body;
        const resumeFile = req.file;

        if (!resumeFile) return res.status(400).send("No resume uploaded.");

        // FIX: pdf-parse handles extraction here
        // We use a fallback logic to ensure the function is called correctly
        let resumeText = "";
        try {
            const data = await pdf(resumeFile.buffer);
            resumeText = data.text;
        } catch (e) {
            // Some versions export differently, let's try a direct call
            const directPdf = require('pdf-parse/lib/pdf-parse.js');
            const data = await directPdf(resumeFile.buffer);
            resumeText = data.text;
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
        
        res.json(JSON.parse(text));

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Failed to analyze resume", details: error.message });
    }
});

const PORT = process.env.PORT || 9393;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});