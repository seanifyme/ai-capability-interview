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

// Format interview data for LLM training
export function formatInterviewForTraining(interview: any) {
  // Format the conversation transcript into a coherent prompt
  const prompt = `Role: ${interview.role}
Department: ${interview.department}
Type: ${interview.type}

Conversation:
${interview.messages?.map((m: any) => `${m.role}: ${m.content}`).join('\n')}`;

  // Format the completion (the AI's analysis)
  const completion = `Readiness Score: ${interview.readinessScore}

Benchmark Summary:
${interview.benchmarkSummary}

Key Recommendations:
${interview.recommendations?.join('\n')}

Strengths:
${interview.strengths?.join('\n')}

Weaknesses:
${interview.weaknesses?.join('\n')}`;

  // Return the prompt-completion pair
  return {
    prompt,
    completion
  };
}

// Convert training data to JSONL format for Replicate
export function convertToJSONL(interviews: any[]) {
  return interviews
    .map(interview => JSON.stringify({
      prompt: interview.trainingData.prompt,
      completion: interview.trainingData.completion
    }))
    .join('\n');
}
