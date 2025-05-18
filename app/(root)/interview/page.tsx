import { redirect } from "next/navigation";
import Agent from "@/components/Agent";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { db } from "@/firebase/admin";
import { getInterviewsByUserId } from "@/lib/actions/general.action";

/* create a stub interview doc and return its ID */
async function createInterviewStub(userId: string) {
    // First check if there's an existing unfinalized interview
    const existingInterviews = await db
        .collection("interviews")
        .where("userId", "==", userId)
        .where("finalized", "==", false)
        .where("type", "==", "AI Readiness")
        .limit(1)
        .get();
    
    // If there's an existing unfinalized interview, use it instead of creating a new one
    if (!existingInterviews.empty) {
        console.log("Found existing unfinalized interview, reusing it");
        return existingInterviews.docs[0].id;
    }
    
    // Otherwise create a new interview stub
    const ref = await db.collection("interviews").add({
        userId,
        role: "tbc",
        createdAt: new Date().toISOString(),
        finalized: false,
        type: "AI Readiness",
    });
    return ref.id;
}

const Page = async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/sign-in");

    /* 1. make an empty interview so we have an ID for redirects */
    const interviewId = await createInterviewStub(user.id);

    return (
        <>
            <h3 className="text-2xl font-semibold mb-6">
                Start Your AI Readiness Audit
            </h3>

            <Agent
                userName={user.name}
                userId={user.id}
                interviewId={interviewId}
                jobTitle={user.jobTitle || ""}
                department={user.department || ""}
                seniority={user.seniority || ""}
                location={user.location || ""}
            />

        </>
    );
};

export default Page;
