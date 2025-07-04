import Resolver from "@forge/resolver";
import { asUser, route } from "@forge/api";
import axios from "axios";

const resolver = new Resolver();

// Function to decode HTML entities
function decodeHTMLEntities(str) {
  return str
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// Function to extract content
async function extractContent(pageLink) {
  const regex = /pages\/(\d+)/;
  const extractedPageId = pageLink.match(regex);

  if (!extractedPageId) {
    return { response: "Error: Page Id is missing" };
  }

  const contentId = extractedPageId[1];
  console.log(`Extracted contentId ID: ${contentId}`);

  if (!contentId) {
    throw new Error("Content ID is missing");
  }

  const response = await asUser().requestConfluence(
    route`/wiki/rest/api/content/${contentId}?expand=body.storage`
  );
  const data = await response.json();

  let pageContent = data.body.storage.value;

  // Remove unnecessary elements and split into paragraphs
  const paragraphs = pageContent.split(/<\/p>|(?:\n\s*\n)/).filter(Boolean);
  
  pageContent = paragraphs.join("</p>");

  let plainTextContent = pageContent.replace(/<sup>.*?<\/sup>/g, "");
  plainTextContent = plainTextContent.replace(/<[^>]*>/g, "");
  plainTextContent = decodeHTMLEntities(plainTextContent);

  const contentLength = plainTextContent.split(" ").length; // Calculate word count
  return { content: plainTextContent, length: contentLength };
}

// Resolver to fetch customization options (content length only)
resolver.define("getCustomizationOptions", async (req) => {
  const { pageLink } = req.payload;
  try {
    const { length } = await extractContent(pageLink);
    console.log("Length: ", length);
    return { length };
  } catch (error) {
    console.error("Error extracting content:", error);
    return { response: "Error extracting content" };
  }
});

// Main resolver to get quiz based on customized or default options
resolver.define("getText", async (req) => {
  const { pageLink, numQuestions, questionType } = req.payload;

  let content, length;
  let questionCount = numQuestions; // Start with provided numQuestions if customization is given

  try {
    // Fetch content and length in all cases
    const result = await extractContent(pageLink);
    content = result.content;
    length = result.length;

    // Set default question count based on content length if no customization is provided
    if (!numQuestions || !questionType) {
      questionCount = length < 500 ? 5 : 10;
      console.log("No Customiation");
    }
  } catch (error) {
    console.error("Error extracting content:", error);
    return { response: "Error extracting content" };
  }

  if (length < 250) {
    return { response: "Minimum 250 words required to generate a quiz." };
  }

  // Set the question type prompt based on user customization or default values
  const questionTypePrompt =
    questionType === "TF" ? "true/false" : "multiple-choice";

  console.log("questionCount: ", questionCount);
  console.log("questionTypePrompt: ", questionTypePrompt);

  const prompt = `
      Generate ${questionCount} well-crafted and meaningful ${questionTypePrompt} quiz questions in JSON format:

      {
        "questions": [
          {
            "question": "Question text here",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option B"
          }
        ]
      }

      Please return the JSON structure directly without code block formatting, backticks, or any additional text.
      The quiz should be based on the following content: ${content}
    `;

  return axios
    .post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    )
    .then((geminiResponse) => {
      let quizJson = geminiResponse.data.candidates[0].content.parts[0].text;

      // Ensure no code block artifacts are present
      quizJson = quizJson.replace(/```/g, "").trim(); // Remove any backticks or extra formatting

      try {
        const parsedQuiz = JSON.parse(quizJson); // Parse the JSON
        console.log("Parsed Quiz JSON:", parsedQuiz);
        return {
          response: JSON.stringify(parsedQuiz),
          numQuestions: questionCount,
        }; // Return the parsed quiz as JSON
      } catch (err) {
        console.error("Error parsing JSON:", err);
        return { response: "Error parsing quiz JSON" };
      }
    })
    .catch((error) => {
      console.error("Error generating quiz:", error);
      return { response: "Error generating quiz" };
    });
});

export const handler = resolver.getDefinitions();
