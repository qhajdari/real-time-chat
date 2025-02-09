import axios from "axios";

// Get OpenAI API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
console.log("API Key:", process.env.OPENAI_API_KEY);

// Function to call OpenAI API
export const getChatSummary = async(chats) => {
  try {
    // Convert messages to a formatted string
    const chatText = chats
      .map((chat) => `${chat.author}: ${chat.message}`)
      .join("\n");

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Summarize the following chat conversation. in albanian",
          },
          { role: "user", content: chatText },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    console.log("Chat Summary:", response);
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(
      "Error fetching summary:",
      error.response ? error.response.data : error.message
    );
  }
  return "";
}
