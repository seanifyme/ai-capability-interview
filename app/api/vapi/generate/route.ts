import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
    try {
        /* ─────────────────────────────────────────
           1. Parse the JSON body coming from Vapi’s
              storeInterviewExtended function tool
        ───────────────────────────────────────── */
        const body = await request.json();
        console.log("🔥 Incoming Vapi request body:", body);

        /* Extract the fields defined in the tool-schema */
        const {
            userId,
            employeeId,
            role,
            department,
            teamSize,
            responsibilities,
            processMap,
            metricsUsed,
            painPoints,
            rootCauses,
            currentTools,
            dataFlows,
            aiExposure,
            aiOpportunities,
            changeAppetite,
            blockers
        } = body;

        /* ─────────────────────────────────────────
           2. Basic validation
        ───────────────────────────────────────── */
        const required: Record<string, unknown> = {
            userId,
            employeeId,
            role,
            department,
            responsibilities,
            painPoints,
            currentTools,
            aiExposure,
            changeAppetite
        };

        for (const [key, value] of Object.entries(required)) {
            if (
                value === undefined ||
                value === null ||
                (typeof value === "string" && value.trim() === "")
            ) {
                console.error(`❌ Missing or empty field: ${key}`);
                return Response.json(
                    { success: false, error: `Missing or empty field: ${key}` },
                    { status: 400 }
                );
            }
        }

        /* ─────────────────────────────────────────
           3. Classify the role to help your dashboard
        ───────────────────────────────────────── */
        const { text: roleCategoryRaw } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: `
You are a role-classification AI.

Assign the role below to one of:
- Software Engineering
- Product Management
- Product Design / UX
- Marketing / Growth
- Customer Support / Ops
- Leadership / Strategy
- Other / Admin

Role: ${role}

Return the category only.
      `.trim()
        });

        const roleCategory = roleCategoryRaw.trim().replace(/["']/g, "");

        /* ─────────────────────────────────────────
           4. Generate the AI-Readiness report
        ───────────────────────────────────────── */
        console.log("🧠 Sending prompt to Gemini...");
        const { text: reportOutput } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: `
You are a senior AI-strategy consultant. Produce a concise
AI-Readiness Audit using the employee inputs below.

Inputs:
• Role: ${role}
• Department: ${department}
• Team size: ${teamSize}
• Responsibilities: ${responsibilities}
• Process map: ${processMap}
• Metrics used: ${metricsUsed}
• Pain-points: ${painPoints}
• Root causes: ${rootCauses}
• Current tools: ${currentTools}
• Data flows: ${dataFlows}
• Existing AI exposure: ${aiExposure}
• High-impact AI opportunities: ${aiOpportunities}
• Appetite for change: ${changeAppetite}
• Blockers: ${blockers}

Return **only** JSON of the form:
{
  "readinessScore": number,
  "benchmarkSummary": string,
  "recommendations": [string],
  "strengths": [string],
  "weaknesses": [string]
}
      `.trim()
        });

        const cleaned = reportOutput.replace(/```json|```/g, "").trim();
        const {
            readinessScore,
            benchmarkSummary,
            recommendations,
            strengths,
            weaknesses
        } = JSON.parse(cleaned);

        /* ─────────────────────────────────────────
           5. Store everything in Firestore
        ───────────────────────────────────────── */
        const interviewDoc = {
            userId,
            employeeId,
            role,
            roleCategory,
            department,
            teamSize,
            responsibilities,
            processMap,
            metricsUsed,
            painPoints,
            rootCauses,
            currentTools,
            dataFlows,
            aiExposure,
            aiOpportunities,
            changeAppetite,
            blockers,
            readinessScore,
            benchmarkSummary,
            recommendations,
            strengths,
            weaknesses,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
            type: "AI Readiness"
        };

        await db.collection("interviews").add(interviewDoc);
        console.log("✅ Interview saved to Firestore");

        return Response.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("🔥 Error in /api/vapi/generate:", error);
        return Response.json(
            { success: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}
