import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("🔥 Incoming Vapi request body:", body);

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
    } = body;

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

    console.log("✅ Gemini response:", questions);

    let recommendations: string[] = [];
    try {
      recommendations = JSON.parse(questions);
    } catch (err) {
      console.error("❌ Failed to parse Gemini response:", err);
      return Response.json({ success: false, error: "Invalid AI response format" }, { status: 500 });
    }

    const interviewRaw = {
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
      recommendations,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

// Remove undefined/null values
    const interview = Object.fromEntries(
        Object.entries(interviewRaw).filter(([_, v]) => v !== undefined && v !== null)
    );


    await db.collection("interviews").add(interview);

    console.log("✅ Interview saved to Firestore");
    return Response.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("🔥 Error in /api/vapi/generate:", error);
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
