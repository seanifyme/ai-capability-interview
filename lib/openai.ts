import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateOpenAIFeedback(prompt: string) {
  try {
    console.log("🤖 Calling GPT-4o to generate AI readiness report...");
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
      max_tokens: 4000, // Ensure we have enough tokens for a detailed report
    });
    
    const content = completion.choices[0].message.content;
    
    if (!content) {
      console.error("❌ Empty response from OpenAI");
      return null;
    }
    
    try {
      // Verify we can parse the JSON
      JSON.parse(content);
      console.log("✅ Successfully generated valid JSON report");
      return content;
    } catch (parseError) {
      console.error("❌ OpenAI returned invalid JSON:", parseError);
      return null;
    }
  } catch (error) {
    console.error("❌ Error calling OpenAI:", error);
    return null;
  }
} 