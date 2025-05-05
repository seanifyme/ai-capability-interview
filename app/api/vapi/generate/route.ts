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

        // 👇 New Gemini prompt generating full report
        const { text: reportOutput } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: `
You are an AI transformation consultant. Based on the following user answers, generate an AI Readiness Audit Report.

Company: ${companyname}
Department: ${department}
Role: ${role}
Team Size: ${teamsize}
Responsibilities: ${responsibilities}
Bottlenecks: ${bottlenecks}
Impact Areas: ${impactareas}
AI Familiarity (1–10): ${aifamiliarity}
Priority Goal: ${prioritygoal}
Urgency: ${urgency}

Please return a JSON object in this format:

{
  "readinessScore": 82,
  "benchmarkSummary": "You are ahead of 70% of peers in similar roles in the UAE. Globally, you're slightly above average.",
  "recommendations": [
    "AI Recommendation 1",
    "AI Recommendation 2"
  ]
}
`
        });

        console.log("✅ Gemini response:", reportOutput);

        let auditData;
        try {
            const cleaned = reportOutput.replace(/```json|```/g, "").trim();
            auditData = JSON.parse(cleaned);
        } catch (err) {
            console.error("❌ Failed to parse Gemini response:", err);
            return Response.json({ success: false, error: "Invalid AI response format" }, { status: 500 });
        }

        // Prepare full interview object
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
            recommendations: auditData.recommendations,
            readinessScore: auditData.readinessScore,
            benchmarkSummary: auditData.benchmarkSummary,
            userId: userid,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),

            // Needed by InterviewCard
            techstack: ["AI", "Automation"],
            questions: ["What task consumes most of your day?", "What decisions could be automated?"],
            type: "AI Readiness",
            level: "N/A"
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
