require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function test() {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash-latest",
    contents: [
      {
        role: "user",
        parts: [{ text: "Say hello" }],
      },
    ],
  });

  console.log(response.text);
}

test();
