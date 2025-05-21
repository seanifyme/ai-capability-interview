import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover, formatInterviewForTraining } from "@/lib/utils";
import { generateOpenAIFeedback } from "@/lib/openai";

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
           4. Generate the AI-Readiness report using OpenAI GPT-4o
        ───────────────────────────────────────── */
        // Extract conversation messages for analysis
        const userMessages = messages
            .filter(m => m.role === "user")
            .map(m => m.content);

        const assistantMessages = messages
            .filter(m => m.role === "assistant")
            .map(m => m.content);

        // Extract 10 most substantive user responses (typically the longest ones)
        const substantiveResponses = [...userMessages]
            .sort((a, b) => b.length - a.length)
            .slice(0, 10);

        const prompt = `
You are a senior AI-strategy consultant analyzing an interview transcript to produce a comprehensive AI-Readiness Audit. Your assessment will help organizations understand their AI maturity and implementation readiness.

INTERVIEW CONTEXT:
• Role: ${role}
• Department: ${department}
• Team Size: ${teamSize || "Not specified"}
• Interview Completion Status: ${body.finalized ? "Complete" : "Incomplete"}

PRE-EXTRACTED INTERVIEW INSIGHTS:
• Responsibilities: ${responsibilities}
• Process Map: ${processMap || "Not provided"}
• Metrics Used: ${metricsUsed || "Not provided"}
• Pain Points: ${painPoints}
• Root Causes: ${rootCauses || "Not specified"}
• Current Tools: ${currentTools}
• Data Flows: ${dataFlows || "Not specified"}
• Existing AI Exposure: ${aiExposure}
• High-Impact AI Opportunities: ${aiOpportunities || "To be determined"}
• Appetite for Change: ${changeAppetite}
• Blockers: ${blockers || "Not specified"}

KEY USER RESPONSES FROM INTERVIEW:
${substantiveResponses.map((response, i) => `[${i+1}] ${response}`).join('\n\n')}

ANALYSIS FRAMEWORK:
1. Technical Readiness (25%):
   - Current tools sophistication
   - Data infrastructure and quality
   - Integration capabilities
   - Technical debt assessment

2. Process Readiness (25%):
   - Clear process documentation
   - Repetitive task identification
   - Decision points that could benefit from AI
   - Existing automation maturity

3. People Readiness (25%):
   - Team AI literacy
   - Leadership support
   - Change appetite
   - Skills availability

4. Strategic Readiness (25%):
   - Clear metrics and KPIs
   - Resource allocation potential
   - Alignment with business goals
   - Competitive pressure understanding

Instructions:
1. Conduct a deep analysis of both pre-extracted insights AND the key user responses
2. For each framework category, identify specific evidence from the interview
3. Tailor your assessment to the specific role/department context
4. Focus on practical, implementation-oriented insights rather than theoretical possibilities
5. Consider both technical feasibility and organizational readiness in your scoring
6. For each recommendation, include "Why", "What", and "How" components

Return **only** JSON of the form:
{
  "readinessScore": number between 1-100 based on the framework percentages,
  "benchmarkSummary": concise evidence-based assessment (100-150 words) with role-specific context,
  "recommendations": [
    "Implement [specific AI solution] for [specific process] to address [specific pain point]. Begin with [practical first step].",
    "Automate [specific workflow] using [appropriate technology] to reduce [quantified inefficiency]. This would require [key implementation requirement].",
    "Integrate [specific AI capability] into [existing tool] to enhance [specific metric]."
  ],
  "strengths": [
    "Specific strength with evidence from interview",
    "Another concrete strength tied to readiness"
  ],
  "weaknesses": [
    "Specific weakness with evidence from interview",
    "Another concrete weakness tied to readiness"
  ]
}
`.trim();

        let readinessScore = 50; // default
        let benchmarkSummary = "AI readiness assessment completed.";
        let recommendations = ["Consider exploring AI solutions for your workflow."];
        let strengths = ["Existing knowledge of business processes."];
        let weaknesses = ["Limited AI exposure."];

        try {
            const reportOutput = await generateOpenAIFeedback(prompt);
            if (!reportOutput) {
                throw new Error("No response from OpenAI");
            }
            const cleaned = reportOutput.replace(/^```json\n|^```\n|```$/g, "").trim();
            console.log("Parsing OpenAI response...");
            const parsedOutput = JSON.parse(cleaned);
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
            console.error("Error parsing OpenAI output:", error);
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
            // Store the raw extracted texts
            responsibilities: body.responsibilities || "",
            processMap: body.processMap || "Not specified",
            metricsUsed: body.metricsUsed || "Not specified",
            painPoints: body.painPoints || "",
            rootCauses: body.rootCauses || "Not specified",
            currentTools: body.currentTools || "",
            dataFlows: body.dataFlows || "Not specified",
            aiExposure: body.aiExposure || "",
            aiOpportunities: body.aiOpportunities || "Not specified",
            changeAppetite: body.changeAppetite || "",
            blockers: body.blockers || "Not specified",
            
            // Store the structured analytics data if available
            structuredData: body.structuredData || {
                automationLevel: null,
                aiExposureLevel: 0,
                changeReadiness: 0,
                teamSize: null,
                timeSpentOnRepetitiveTasks: null,
                toolsUsed: [],
                aiToolsUsed: [],
                metricsUsed: [],
                extractionConfidence: 0
            },
            
            // Store metadata about the extraction process
            extractionMethod: body.extractionMethod || "keyword-matching",
            
            // Generated report data
            readinessScore,
            benchmarkSummary,
            recommendations,
            strengths,
            weaknesses,
            
            // Metadata
            finalized: body.finalized !== undefined ? body.finalized : true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
            type: "AI Readiness",
            
            // Store raw messages for training
            messages,
            
            // Format messages for LLM training
            trainingData: formatInterviewForTraining({
                role,
                type: "AI Readiness",
                messages,
                readinessScore,
                benchmarkSummary,
                recommendations,
                structuredData: body.structuredData, // Pass structured data to training format
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
