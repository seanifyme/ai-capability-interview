import { interviewCovers, mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const techIconBaseURL = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const normalizeTechName = (tech: string) => {
  const key = tech.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");
  return mappings[key as keyof typeof mappings];
};

const checkIconExists = async (url: string) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok; // Returns true if the icon exists
  } catch {
    return false;
  }
};

export const getTechLogos = async (techArray: string[]) => {
  const logoURLs = techArray.map((tech) => {
    const normalized = normalizeTechName(tech);
    return {
      tech,
      url: `${techIconBaseURL}/${normalized}/${normalized}-original.svg`,
    };
  });

  const results = await Promise.all(
    logoURLs.map(async ({ tech, url }) => ({
      tech,
      url: (await checkIconExists(url)) ? url : "/tech.svg",
    }))
  );

  return results;
};

export const getRandomInterviewCover = () => {
  const randomIndex = Math.floor(Math.random() * interviewCovers.length);
  return `/covers${interviewCovers[randomIndex]}`;
};

// Enhanced training data formatter with conversational context
export function formatInterviewForTraining(interview: any): { prompt: string; response: string }[] {
  const lines: { prompt: string; response: string }[] = [];
  const messages = interview.messages || [];
  
  // Create a system message with interview context
  const systemContext = `You are Leila, Principal AI Strategy Consultant at SingularShift, conducting an AI readiness interview with a ${interview.role} in the ${interview.department} department. 
Your goal is to understand their workflows, tools, challenges, and opportunities for AI implementation.
Respond in a warm, professional tone with short, focused questions. Use British English.`;
  
  // Track conversation history for context window
  const conversationHistory: {role: string, content: string}[] = [];
  const maxHistoryItems = 4; // Keep last 2 turns (4 messages) for context
  
  // Process messages with conversational context
  for (let i = 0; i < messages.length - 1; i++) {
    const current = messages[i];
    const next = messages[i + 1];
    
    if (current.role === "user" && next.role === "assistant") {
      // Build contextual prompt with system message and conversation history
      let contextualPrompt = systemContext;
      
      // Add conversation history
      if (conversationHistory.length > 0) {
        contextualPrompt += "\n\nConversation history:\n";
        conversationHistory.forEach(msg => {
          contextualPrompt += `${msg.role === "user" ? "User" : "You"}: ${msg.content.trim()}\n`;
        });
      }
      
      // Add current user message
      contextualPrompt += `\nUser: ${current.content.trim()}\n\nYou: `;
      
      // Add to training data
      lines.push({
        prompt: contextualPrompt.trim(),
        response: next.content.trim()
      });
      
      // Update conversation history
      conversationHistory.push(current);
      conversationHistory.push(next);
      
      // Keep history within max size
      while (conversationHistory.length > maxHistoryItems) {
        conversationHistory.shift();
      }
    }
  }
  
  // Add report generation samples for fine-tuning if we have structured data and readiness score
  if (interview.structuredData && interview.readinessScore) {
    // Create examples for different report generation tasks
    
    // Example 1: Generate readiness score based on structured data
    const scorePrompt = `You are an AI readiness consultant analyzing interview data to produce a readiness score.

INTERVIEW CONTEXT:
• Role: ${interview.role}
• Department: ${interview.department}
• Team Size: ${interview.structuredData.teamSize || "Not specified"}

STRUCTURED DATA:
• Automation Level: ${interview.structuredData.automationLevel || "Not detected"}%
• AI Exposure Level: ${interview.structuredData.aiExposureLevel || 0}/5
• Change Readiness: ${interview.structuredData.changeReadiness || 0}/5
• Tools Used: ${interview.structuredData.toolsUsed?.join(', ') || "None detected"}
• AI Tools Used: ${interview.structuredData.aiToolsUsed?.join(', ') || "None detected"}
• Time Spent on Repetitive Tasks: ${interview.structuredData.timeSpentOnRepetitiveTasks || "Not specified"} hours/week

Provide an AI readiness score from 0-100 based on this data. Return only the score as a number.`;

    lines.push({
      prompt: scorePrompt,
      response: interview.readinessScore.toString()
    });
    
    // Example 2: Generate recommendations based on structured data
    if (interview.recommendations && interview.recommendations.length > 0) {
      const recPrompt = `You are an AI readiness consultant analyzing interview data to produce recommendations.

INTERVIEW CONTEXT:
• Role: ${interview.role}
• Department: ${interview.department}
• Team Size: ${interview.structuredData.teamSize || "Not specified"}

STRUCTURED DATA:
• Automation Level: ${interview.structuredData.automationLevel || "Not detected"}%
• AI Exposure Level: ${interview.structuredData.aiExposureLevel || 0}/5
• Change Readiness: ${interview.structuredData.changeReadiness || 0}/5
• Tools Used: ${interview.structuredData.toolsUsed?.join(', ') || "None detected"}
• AI Tools Used: ${interview.structuredData.aiToolsUsed?.join(', ') || "None detected"}
• Time Spent on Repetitive Tasks: ${interview.structuredData.timeSpentOnRepetitiveTasks || "Not specified"} hours/week

Based on this data, provide 3 specific, practical recommendations for improving AI readiness. Each recommendation should follow the format: "Implement [specific solution] for [specific process] to address [specific pain point]." Return only the recommendations.`;

      // Construct combined response with all recommendations
      const recResponse = interview.recommendations.join('\n\n');
      
      lines.push({
        prompt: recPrompt,
        response: recResponse
      });
    }
    
    // Example 3: Generate benchmark summary based on structured data
    if (interview.benchmarkSummary) {
      const summaryPrompt = `You are an AI readiness consultant analyzing interview data to produce a benchmark summary.

INTERVIEW CONTEXT:
• Role: ${interview.role}
• Department: ${interview.department}
• Team Size: ${interview.structuredData.teamSize || "Not specified"}
• Readiness Score: ${interview.readinessScore}/100

STRUCTURED DATA:
• Automation Level: ${interview.structuredData.automationLevel || "Not detected"}%
• AI Exposure Level: ${interview.structuredData.aiExposureLevel || 0}/5
• Change Readiness: ${interview.structuredData.changeReadiness || 0}/5
• Tools Used: ${interview.structuredData.toolsUsed?.join(', ') || "None detected"}
• AI Tools Used: ${interview.structuredData.aiToolsUsed?.join(', ') || "None detected"}
• Time Spent on Repetitive Tasks: ${interview.structuredData.timeSpentOnRepetitiveTasks || "Not specified"} hours/week

Provide a concise, evidence-based benchmark summary (100-150 words) with role-specific context.`;

      lines.push({
        prompt: summaryPrompt,
        response: interview.benchmarkSummary
      });
    }
  }
  
  return lines;
}

// Convert training data to JSONL format for Replicate
export function convertToJSONL(trainingData: { prompt: string; response: string }[]) {
  return trainingData.map(pair => JSON.stringify(pair)).join('\n');
}
