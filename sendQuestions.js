const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cron = require("node-cron");

require("dotenv").config();

// Configuration
const QUESTIONS_FILE = path.join(__dirname, "questions.json");
const AI_API_URL = "https://inference-api.nousresearch.com/v1/chat/completions";
const AI_API_KEY = process.env.AI_API_KEY;
const INTERVAL_HOURS = 1; // Interval in hours

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
        model: "Hermes-3-Llama-3.1-405B",
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
        },
      }
    );

    // Handle the response as needed
    console.log(`Question: ${question}`);
    console.log("AI Response:", response.data.choices[0].message.content);
    console.log('<------------------------------------------------------>');
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
  // Schedule the task to run every hour
  cron.schedule(`0 */${INTERVAL_HOURS} * * *`, () => {
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
  });

  console.log(
    `Scheduler started. Sending a question every ${INTERVAL_HOURS} hour(s).`
  );
}

// Start the scheduler
scheduleQuestions();
// sendQuestion(questions[0]); // For testing, send the first question immediately
