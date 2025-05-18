import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover, formatInterviewForTraining } from "@/lib/utils";

export async function POST(request: Request) {
    try {
        /* ─────────────────────────────────────────
           1. Parse the JSON body coming from Vapi's
              storeInterviewExtended function tool
        ───────────────────────────────────────── */
        const body = await request.json();
        console.log("🔥 Incoming Vapi request body received");

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
            blockers,
            messages
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
            changeAppetite,
            messages
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

        // Verify messages array has content
        if (!Array.isArray(messages) || messages.length < 2) {
            console.error(`❌ Interview has too few messages: ${messages?.length}`);
            return Response.json(
                { success: false, error: "Interview transcript too short or missing" },
                { status: 400 }
            );
        }

        console.log(`✅ Received ${messages.length} messages in the conversation`);

        /* ─────────────────────────────────────────
           3. Classify the role to help your dashboard
        ───────────────────────────────────────── */
        console.log("🔍 Classifying role category...");
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
        console.log(`✅ Role classified as: ${roleCategory}`);

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
• Team size: ${teamSize || "Not specified"}
• Responsibilities: ${responsibilities}
• Process map: ${processMap || "Not provided"}
• Metrics used: ${metricsUsed || "Not provided"}
• Pain-points: ${painPoints}
• Root causes: ${rootCauses || "Not specified"}
• Current tools: ${currentTools}
• Data flows: ${dataFlows || "Not specified"}
• Existing AI exposure: ${aiExposure}
• High-impact AI opportunities: ${aiOpportunities || "To be determined"}
• Appetite for change: ${changeAppetite}
• Blockers: ${blockers || "Not specified"}

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

        // Safely parse the JSON output with error handling
        let readinessScore = 50; // default
        let benchmarkSummary = "AI readiness assessment completed.";
        let recommendations = ["Consider exploring AI solutions for your workflow."];
        let strengths = ["Existing knowledge of business processes."];
        let weaknesses = ["Limited AI exposure."];

        try {
            const cleaned = reportOutput.replace(/```json|```/g, "").trim();
            console.log("Parsing Gemini response...");
            
            const parsedOutput = JSON.parse(cleaned);
            
            // Validate and assign each field with fallbacks
            readinessScore = typeof parsedOutput.readinessScore === 'number' 
                ? parsedOutput.readinessScore 
                : 50;
                
            benchmarkSummary = typeof parsedOutput.benchmarkSummary === 'string' 
                ? parsedOutput.benchmarkSummary 
                : "AI readiness assessment completed.";
                
            recommendations = Array.isArray(parsedOutput.recommendations) 
                ? parsedOutput.recommendations 
                : ["Consider exploring AI solutions for your workflow."];
                
            strengths = Array.isArray(parsedOutput.strengths) 
                ? parsedOutput.strengths 
                : ["Existing knowledge of business processes."];
                
            weaknesses = Array.isArray(parsedOutput.weaknesses) 
                ? parsedOutput.weaknesses 
                : ["Limited AI exposure."];
            
            console.log(`✅ Successfully parsed AI readiness report. Score: ${readinessScore}/100`);
        } catch (error) {
            console.error("Error parsing Gemini output:", error);
            console.error("Raw output:", reportOutput);
            // Continue with default values rather than failing
        }

        /* ─────────────────────────────────────────
           5. Store everything in Firestore
        ───────────────────────────────────────── */
        console.log("💾 Saving interview to Firestore...");
        const interviewDoc = {
            userId,
            employeeId,
            role,
            roleCategory,
            department,
            teamSize: teamSize || "Not specified",
            responsibilities,
            processMap: processMap || "Not specified",
            metricsUsed: metricsUsed || "Not specified",
            painPoints,
            rootCauses: rootCauses || "Not specified",
            currentTools,
            dataFlows: dataFlows || "Not specified",
            aiExposure,
            aiOpportunities: aiOpportunities || "Not specified",
            changeAppetite,
            blockers: blockers || "Not specified",
            readinessScore,
            benchmarkSummary,
            recommendations,
            strengths,
            weaknesses,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
            type: "AI Readiness",
            messages,
            trainingData: formatInterviewForTraining({
                role,
                type: "AI Readiness",
                messages,
                readinessScore,
                benchmarkSummary,
                recommendations,
                strengths,
                weaknesses,
                department,
                seniority: body.seniority,
                jobTitle: body.jobTitle,
                createdAt: new Date().toISOString()
            })
        };

        await db.collection("interviews").add(interviewDoc);
        console.log("✅ Interview saved to Firestore with training data");

        return Response.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("🔥 Error in /api/vapi/generate:", error);
        return Response.json(
            { success: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}
