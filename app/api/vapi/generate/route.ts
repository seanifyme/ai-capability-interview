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
            role,
            department,
            teamsize,
            responsibilities,
            aifamiliarity,
            bottlenecks,
            impactareas,
            prioritygoal,
            urgency,
            userid
        } = body;

        // 👇 Gemini prompt to generate realistic, tailored AI Readiness Audit
        const { text: reportOutput } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: `
You are an enterprise AI transformation consultant. Based on the user's answers below, create an accurate and realistic AI Readiness Audit.

Use these fields to inform your judgement:
- Role: ${role}
- Department: ${department}
- Team Size: ${teamsize}
- Workflows: ${responsibilities}
- Current AI Usage: ${aifamiliarity}
- Bottlenecks: ${bottlenecks}
- Desired Automation Areas: ${impactareas}
- Primary Goal: ${prioritygoal}
- Urgency: ${urgency}

Please return a JSON object with the following format:
{
  "readinessScore": number (0-100),
  "benchmarkSummary": string,
  "recommendations": [ "AI use case 1", "AI use case 2", ... ],
  "strengths": [ "Strength 1", "Strength 2", ... ],
  "weaknesses": [ "Weakness 1", "Weakness 2", ... ]
}

Be highly realistic. For example, if the team size is small, AI familiarity is low, and current usage is minimal, the score should reflect that. Only assign a score above 80 if the company shows advanced familiarity and usage.

Benchmark summary should compare this user to others in similar roles in their region.

Recommendations should be highly relevant to their workflows and bottlenecks.
`
        });

        console.log("✅ Gemini response:", reportOutput);

        // ✅ Extract structured fields from Gemini's JSON response
        const cleaned = reportOutput.replace(/```json|```/g, "").trim();

        const {
            readinessScore,
            benchmarkSummary,
            recommendations,
            strengths,
            weaknesses
        } = JSON.parse(cleaned);

        // ✅ Prepare Firestore-ready interview object
        const interviewRaw = {
            companyname,
            role,
            department,
            teamsize,
            responsibilities,
            aifamiliarity,
            bottlenecks,
            impactareas,
            prioritygoal,
            urgency,
            readinessScore,
            benchmarkSummary,
            recommendations,
            strengths,
            weaknesses,
            userId: userid,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),

            // Required by InterviewCard component
            techstack: ["AI", "Automation"],
            questions: ["What task consumes most of your day?", "What decisions could be automated?"],
            type: "AI Readiness",
            level: "N/A"
        };

        // ✅ Remove any undefined/null entries
        const interview = Object.fromEntries(
            Object.entries(interviewRaw).filter(([, v]) => v !== undefined && v !== null)
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
