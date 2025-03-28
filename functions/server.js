const express = require("express");
const serverless = require("serverless-http");

const app = express();
const router = express.Router();



// const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
// const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello from Express on Netlify!" });
});

app.use("/.netlify/functions/server", router);

module.exports.handler = serverless(app);


// const app = express();
app.use(express.static(path.join(__dirname, "../static")));
app.use(bodyParser.json());

const API_KEY = process.env.GEMINI_API_KEY;
// console.log(API_KEY);
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

let resumeChunks = [];
try {
  const data = fs.readFileSync(path.join(__dirname, "../resume_chunks.json"), "utf8");
  resumeChunks = JSON.parse(data);
  console.log(`Loaded ${resumeChunks.length} resume chunks`);
} catch (err) {
  console.error("Error loading resume chunks:", err);
}

function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (normA * normB);
}

async function getEmbedding(text) {
  return [0.1, 0.2, 0.3, 0.4, 0.5]; 
}


async function retrieveResumeContext(query, topK = 2) {
  const queryEmbedding = await getEmbedding(query);
  
  const scored = resumeChunks.map(chunk => ({
    chunk: chunk.chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));
  
  scored.sort((a, b) => b.score - a.score);
  // Return top K chunks
  return scored.slice(0, topK).map(item => item.chunk);
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../static", "index.html"));
});


app.post("/ask", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: "Message is required" });
    }


    const contextChunks = await retrieveResumeContext(userMessage, 2); // Top 2 chunks

    // Build structured prompt for better AI responses
    const prompt = `
    You are an AI assistant helping to answer questions based on my resume. 
    Use the provided resume context to generate a structured response.

    Resume Context:
    ${contextChunks.join("\n\n")}

    User Question: ${userMessage}

    Provide a well-formatted answer in this structure:
    - Relevant Experience: (Summarize relevant details)
    - Key Skills: (List key skills related to the query)
    - Projects/Work: (Mention relevant projects or work)
    - Suggestions (if applicable): (Provide additional useful information)

    Your Answer:
    `;

    // Send request to Gemini API
    const requestData = {
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    };

    const response = await axios.post(GEMINI_API_URL, requestData, {
      headers: { "Content-Type": "application/json" }
    });

    // Log response for debugging
    console.log("Gemini API Response:", JSON.stringify(response.data, null, 2));

    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      const botReply = response.data.candidates[0].content.parts[0].text;
      res.json({ reply: botReply });
    } else {
      res.status(500).json({ error: "Invalid response from Gemini API" });
    }
  } catch (error) {
    console.error("Error in /ask endpoint:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Failed to get response from Gemini" });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
