import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("🔥 Incoming Vapi request body:", body);

        const {
            userid,
            companyname,
            location,
            role,
            department,
            teamsize,
            crossfunctioninteraction,
            responsibilities,
            trackingtools,
            manualhours,
            aitools,
            aitoolimpact,
            manualpainpoints,
            bottlenecks,
            automationwish,
            redundancyexamples,
            decisionfriction,
            customerpainpoints,
            prioritygoal,
            trackedmetrics,
            timesavingimpact,
            urgency,
            aiconcerns,
            aifamiliarity,
            competitorcomparison
        } = body;

        // 🔍 Classify role for dashboard filtering
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

        // 📊 Generate AI Readiness Audit using all employee inputs
        const { text: reportOutput } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: `
You are a senior enterprise AI transformation consultant conducting an AI Readiness Audit for a company employee. Your task is to analyse the following employee inputs in order to produce a precise, data-driven report.

The outputs must be personalised, grounded in operational realities, and benchmarked realistically against peers in similar roles and locations.

---

🎯 Use the following inputs to guide your analysis:

- Company Name: ${companyname}
- Location: ${location}
- Job Title: ${role}
- Department: ${department}
- Team Size: ${teamsize}
- Cross-Functional Collaboration: ${crossfunctioninteraction}
- Core Responsibilities: ${responsibilities}
- Tools Used to Track Work: ${trackingtools}
- Hours Spent on Manual/Repetitive Tasks: ${manualhours}
- AI / Automation Tools in Use: ${aitools}
- Perceived Effectiveness of These Tools: ${aitoolimpact}
- Remaining Manual Pain Points: ${manualpainpoints}
- Operational Bottlenecks: ${bottlenecks}
- If They Could Automate One Task: ${automationwish}
- Examples of Redundancy / Duplicate Work: ${redundancyexamples}
- Decision-Making Delays or Friction: ${decisionfriction}
- Customer or User Complaints: ${customerpainpoints}
- Primary Goal (Speed, Cost, Growth, etc): ${prioritygoal}
- KPIs Being Tracked (or lack thereof): ${trackedmetrics}
- If Given 5 Free Hours a Week, They Would Use It To...: ${timesavingimpact}
- Concerns About AI: ${aiconcerns}
- Self-Rated Familiarity with AI (1–5): ${aifamiliarity}
- How They Think They Compare to Peers in AI Adoption: ${competitorcomparison}
- Urgency for Change: ${urgency}

---

🧠 Based on this, return a JSON object structured exactly like this:

{
  "readinessScore": number (0-100),
  "benchmarkSummary": string,
  "recommendations": [ "AI use case 1", "AI use case 2", "AI use case 3" ],
  "strengths": [ "Strength 1", "Strength 2" ],
  "weaknesses": [ "Weakness 1", "Weakness 2" ]
}

---

⚠️ Guidelines:

- Be objective — don’t inflate scores. Only assign 80+ if they show high familiarity, active tools in use, strong KPI discipline, and urgency.
- If team size is small, or tooling is minimal, score should reflect that.
- Tailor recommendations to actual workflows and responsibilities.
- Benchmark comparisons should reference common gaps or strengths in the given department, role, or geography.
- Weaknesses must be constructive but direct. No fluff.

Return only the JSON response. No commentary or markdown.
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

        // ✅ Store result in Firestore
        const interview = {
            userId: userid,
            companyname,
            location,
            role,
            roleCategory,
            department,
            teamsize,
            crossfunctioninteraction,
            responsibilities,
            trackingtools,
            manualhours,
            aitools,
            aitoolimpact,
            manualpainpoints,
            bottlenecks,
            automationwish,
            redundancyexamples,
            decisionfriction,
            customerpainpoints,
            prioritygoal,
            trackedmetrics,
            timesavingimpact,
            urgency,
            aiconcerns,
            aifamiliarity,
            competitorcomparison,
            readinessScore,
            benchmarkSummary,
            recommendations,
            strengths,
            weaknesses,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
            techstack: ["AI", "Automation"],
            questions: [
                "What task consumes most of your day?",
                "What decisions could be automated?"
            ],
            type: "AI Readiness",
            level: "N/A"
        };

        await db.collection("interviews").add(interview);
        console.log("✅ Interview saved to Firestore");

        return Response.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("🔥 Error in /api/vapi/generate:", error);
        return Response.json({ success: false, error: error }, { status: 500 });
    }
}
