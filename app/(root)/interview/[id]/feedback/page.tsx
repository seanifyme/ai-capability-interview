import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
    getFeedbackByInterviewId,
    getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";

// 👇 Typed separately now
type FeedbackWithExtras = {
    totalScore?: number;
    createdAt?: string;
    benchmark?: string;
    recommendations?: string[];
};

type InterviewWithExtras = {
    strengths?: string[];
    weaknesses?: string[];
    roleCategory?: string;
};


const Feedback = async ({ params }: RouteParams) => {
    const { id } = await params;
    const user = await getCurrentUser();

    const interviewRaw = await getInterviewById(id);
    if (!interviewRaw) redirect("/");

    const feedbackRaw = await getFeedbackByInterviewId({
        interviewId: id,
        userId: user?.id || "",
    });

    const feedback = feedbackRaw as FeedbackWithExtras;
    const interview = interviewRaw as InterviewWithExtras;

    return (
        <section className="section-feedback">
            {/* Title */}
            <div className="flex flex-row justify-center">
                <h1 className="text-4xl font-semibold">
                    Your AI Readiness Audit Report
                </h1>
            </div>

            {/* Score + Date + Role Category */}
            <div className="flex flex-row justify-center mt-4">
                <div className="flex flex-row gap-5">
                    {/* Score */}
                    <div className="flex flex-row gap-2 items-center">
                        <Image src="/star.svg" width={22} height={22} alt="star" />
                        <p>
                            AI Readiness Score:{" "}
                            <span className="text-primary-200 font-bold">
          {feedback?.totalScore ?? "---"}
        </span>
                            /100
                        </p>
                    </div>

                    {/* Date */}
                    <div className="flex flex-row gap-2 items-center">
                        <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
                        <p>
                            {feedback?.createdAt
                                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                                : "N/A"}
                        </p>
                    </div>

                    {/* Role Category */}
                    {interview?.roleCategory && (
                        <div className="flex flex-row gap-2 items-center">
                            <Image src="/user.svg" width={22} height={22} alt="role" />
                            <p>
                                Role Category:{" "}
                                <span className="text-primary-200 font-bold">
            {interview.roleCategory}
          </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <hr className="my-6" />

            {/* Benchmark Summary */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold">Benchmark Summary</h2>
                <p className="mt-2 text-dark200_light800">
                    {feedback?.benchmark || "Benchmark insights not available."}
                </p>
            </div>

            {/* Strengths */}
            {Array.isArray(interview?.strengths) && interview.strengths.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">Your Strengths</h2>
                    <ul className="list-disc ml-5 mt-3 space-y-2 text-green-700 dark:text-green-400">
                        {interview.strengths.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Weaknesses */}
            {Array.isArray(interview?.weaknesses) && interview.weaknesses.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">Your Weaknesses</h2>
                    <ul className="list-disc ml-5 mt-3 space-y-2 text-red-700 dark:text-red-400">
                        {interview.weaknesses.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Recommendations */}
            <div>
                <h2 className="text-xl font-semibold">Recommended AI Use Cases</h2>
                <ul className="list-disc ml-5 mt-3 space-y-2 text-dark200_light800">
                    {feedback?.recommendations?.length ? (
                        feedback.recommendations.map((rec: string, index: number) => (
                            <li key={index}>{rec.replace(/\*\*/g, "")}</li>
                        ))
                    ) : (
                        <li>No recommendations found for this user.</li>
                    )}
                </ul>
            </div>

            {/* Navigation */}
            <div className="buttons mt-10">
                <Button className="btn-secondary flex-1">
                    <Link href="/" className="flex w-full justify-center">
                        <p className="text-sm font-semibold text-primary-200 text-center">
                            Back to dashboard
                        </p>
                    </Link>
                </Button>
            </div>
        </section>
    );
};

export default Feedback;
