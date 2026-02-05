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

        // FIX: Ensuring pdf-parse is called correctly regardless of environment
        let pdfData;
        try {
            // Check if pdf is a function or has a .default property
            const parse = typeof pdf === 'function' ? pdf : pdf.default;
            pdfData = await parse(resumeFile.buffer);
        } catch (pdfError) {
            console.error("PDF Parsing Error:", pdfError);
            return res.status(500).json({ error: "Could not read PDF file" });
        }

        const resumeText = pdfData.text;

        // 2. Prepare the AI
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 3. The Prompt
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
        
        // 4. Send the result back
        res.json(JSON.parse(text));

    } catch (error) {
        console.error("Server Error Details:", error);
        res.status(500).json({ 
            error: "Failed to analyze resume", 
            details: error.message 
        });
    }
});

// Port Binding for Render
const PORT = process.env.PORT || 9393;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});