import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateOpenAIFeedback(prompt: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "You are a senior AI-strategy consultant specializing in organizational AI readiness assessments. Analyze interview transcripts thoroughly to extract actionable insights. Return only valid, well-structured JSON as specified in the prompt." 
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" }, // Ensure we get valid JSON
  });
  return completion.choices[0].message.content;
} 