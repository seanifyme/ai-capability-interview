import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateOpenAIFeedback(prompt: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a senior AI-strategy consultant. Return only valid JSON as specified." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });
  return completion.choices[0].message.content;
} 