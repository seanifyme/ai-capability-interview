"use server";

import { db } from "@/firebase/admin";

// ✅ Fetches 1 interview by ID
export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();
  return interview.data() as Interview | null;
}

// ✅ Pulls readiness score, benchmark, and AI use cases from interviews
export async function getFeedbackByInterviewId(
    params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId } = params;

  const interviewDoc = await db.collection("interviews").doc(interviewId).get();
  const data = interviewDoc.data();

  if (!data) return null;

  return {
    interviewId,
    userId: data.userId,
    totalScore: data.readinessScore,
    benchmark: data.benchmarkSummary,
    recommendations: data.recommendations,
    createdAt: data.createdAt,
  };
}

// ✅ For showing peer interviews on homepage (if needed)
export async function getLatestInterviews(
    params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await db
      .collection("interviews")
      .orderBy("createdAt", "desc")
      .where("finalized", "==", true)
      .where("userId", "!=", userId)
      .limit(limit)
      .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

// ✅ For showing the current user's past interviews
export async function getInterviewsByUserId(
    userId: string
): Promise<Interview[] | null> {
  const interviews = await db
      .collection("interviews")
      .where("userId", "==", userId)
      .orderBy("createdAt", "asc")
      .get();

  // Since we're getting them in ascending order, reverse the array before returning
  return interviews.docs.reverse().map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}
