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
            userid,
        } = body;

        // 🔍 1. Classify role using Gemini (enterprise-grade categories)
        const { text: roleCategoryRaw } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: `
You are a role classification AI.

Based on the job title below, assign the user to one of the following categories:

- Software Engineering
- Product Management
- Product Design / UX
- Marketing / Growth
- Customer Support / Ops
- Leadership / Strategy
- Other / Admin

Job Title: ${role}

Return the category only.
    `.trim(),
        });

        const roleCategory = roleCategoryRaw.trim().replace(/["']/g, "");

        // 📊 2. Generate AI Readiness Report
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

Be highly realistic. Only assign a score above 80 if the company shows advanced familiarity and usage.
Benchmark summary should compare this user to others in similar roles in their region.
Recommendations should be highly relevant to their workflows and bottlenecks.
      `.trim(),
        });

        const cleaned = reportOutput.replace(/```json|```/g, "").trim();

        const {
            readinessScore,
            benchmarkSummary,
            recommendations,
            strengths,
            weaknesses,
        } = JSON.parse(cleaned);

        // ✅ 3. Final interview object to store
        const interview = {
            companyname,
            role,
            roleCategory,
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
            techstack: ["AI", "Automation"],
            questions: ["What task consumes most of your day?", "What decisions could be automated?"],
            type: "AI Readiness",
            level: "N/A",
        };

        await db.collection("interviews").add(interview);
        console.log("✅ Interview saved to Firestore");

        return Response.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("🔥 Error in /api/vapi/generate:", error);
        return Response.json({ success: false, error: error }, { status: 500 });
    }
}
