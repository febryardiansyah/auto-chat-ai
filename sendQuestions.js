const fs = require("fs");
const path = require("path");
const axios = require("axios");

require("dotenv").config();
require('colors');

// Configuration
const QUESTIONS_FILE = path.join(__dirname, "questions.json");
const AI_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_API_KEY = process.env.AI_API_KEY;
const INTERVAL_TIMES = 15; // Interval in 15 minutes

// Read questions from the JSON file
let questions = [];
try {
  const data = fs.readFileSync(QUESTIONS_FILE, "utf8");
  questions = JSON.parse(data);
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Questions JSON should be a non-empty array.");
  }
} catch (err) {
  console.error("Error reading questions file:", err.message);
  process.exit(1);
}

// Function to send a question to the AI API
async function sendQuestion(question) {
  try {
    const response = await axios.post(
      AI_API_URL,
      {
        model: "openrouter/auto",
        messages: [
          {
            role: "user",
            content: question,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${AI_API_KEY}`,
          "HTTP-Referer": "https://slm-store.vercel.app/",
          "X-Title": "SLM Store",
        },
      }
    );
    console.log('<================== START OF QUESTION ========================>'.cyan + '\n');
    // Handle the response as needed
    console.log(`Question: `.white.bold, `${question}`.magenta.bold);
    console.log(`Model used: `.white.bold, `${response.data.model}`.red.bold);
    console.log("✅ AI Response:".white.bold, response.data.choices[0].message.content.green.bold);
    console.log('<================== END OF QUESTION========================>'.cyan + '\n');
  } catch (error) {
    console.error("Error sending question:", {
      question,
      message: error.message,
      response: error.response ? error.response.data : "No response data",
    });
  }
}

// Scheduler to send questions at the specified interval
let currentQuestionIndex = 0;

function scheduleQuestions() {
  setInterval(() => {
    if (currentQuestionIndex >= questions.length) {
      console.log("All questions have been sent.");
      // Optionally, reset the index or stop the scheduler
      currentQuestionIndex = 0; // Reset to start over
      // To stop the scheduler after all questions are sent, uncomment the next line
      // process.exit(0);
    }

    const question = questions[currentQuestionIndex];
    sendQuestion(question);
    currentQuestionIndex += 1;
  }, 
  15 * 60 * 1000
  // 10000
); // Convert hours to milliseconds

  console.log(
    `Scheduler started. Sending a question every ${INTERVAL_TIMES} minutes(s)...`.yellow
  );
}

// Start the scheduler
scheduleQuestions();
// sendQuestion(questions[0]); // For testing, send the first question immediately
