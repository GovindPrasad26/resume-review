require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse'); // Fix: Importing as 'pdf' to avoid TypeError
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');

const app = express();
app.use(cors()); // Allows your Vercel frontend to talk to this server

const upload = multer(); // Memory storage for temporary PDF handling
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/resume/score', upload.single('resume'), async (req, res) => {
    try {
        const { jobDescription } = req.body;
        const resumeFile = req.file;

        if (!resumeFile) return res.status(400).send("No resume uploaded.");

        // 1. Convert PDF Buffer to Text using the fixed function call
        const pdfData = await pdf(resumeFile.buffer); 
        const resumeText = pdfData.text;

        // 2. Prepare the Gemini Model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 3. The Prompt (Strict JSON Format instructions)
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
        
        // Cleaning the response from Gemini (removes markdown code blocks)
        let text = response.text().replace(/```json|```/g, "").trim();
        
        // 4. Send the JSON result back to React
        res.json(JSON.parse(text));

    } catch (error) {
        console.error("Server Error Details:", error);
        res.status(500).json({ 
            error: "Failed to analyze resume", 
            details: error.message 
        });
    }
});

// Fix: Render uses a dynamic PORT. '0.0.0.0' allows external access.
const PORT = process.env.PORT || 9393;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});