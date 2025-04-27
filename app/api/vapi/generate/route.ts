import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const {
    companyname,
    department,
    role,
    teamsize,
    responsibilities,
    bottlenecks,
    impactareas,
    aifamiliarity,
    prioritygoal,
    urgency,
    userid
  } = await request.json();

  try {
    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `We are mapping where AI agents can help.
  Company name: ${companyname}
  Department: ${department}
  Role: ${role}
  Team size: ${teamsize}
  Key responsibilities: ${responsibilities}
  Main bottlenecks faced: ${bottlenecks}
  Impact areas desired: ${impactareas}
  Familiarity with AI: ${aifamiliarity}
  Primary goal: ${prioritygoal}
  Urgency level: ${urgency}
  
Please return a JSON array of recommendations for where AI agents could add the most value, formatted like:
["Recommendation 1", "Recommendation 2", …]
`,

    });

    const interview = {
      companyname,
      department,
      role,
      teamsize,
      responsibilities,
      bottlenecks,
      impactareas,
      aifamiliarity,
      prioritygoal,
      urgency,
      recommendations: JSON.parse(questions),
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };


    await db.collection("interviews").add(interview);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
