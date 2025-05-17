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
  // Extract relevant fields for training
  const trainingData = {
    role: interview.role,
    type: interview.type,
    transcript: interview.messages?.map((m: any) => ({
      role: m.role,
      content: m.content
    })),
    readinessScore: interview.readinessScore,
    benchmarkSummary: interview.benchmarkSummary,
    recommendations: interview.recommendations,
    strengths: interview.strengths,
    weaknesses: interview.weaknesses,
    metadata: {
      department: interview.department,
      seniority: interview.seniority,
      jobTitle: interview.jobTitle,
      createdAt: interview.createdAt
    }
  };
  
  // Convert to JSONL format (one JSON object per line)
  return JSON.stringify(trainingData);
}
