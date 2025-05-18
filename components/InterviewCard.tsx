import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";

import { Button } from "./ui/button";
import { getInterviewById } from "@/lib/actions/general.action";

const InterviewCard = async ({
                                 interviewId,
                                 userId,
                                 role,
                                 type,
                                 createdAt,
                             }: InterviewCardProps) => {
    const interview =
        userId && interviewId ? await getInterviewById(interviewId) : null;

    const normalizedType = /mix/gi.test(type) ? "Mixed" : type;

    const badgeColor =
        {
            Behavioral: "bg-light-400",
            Mixed: "bg-light-600",
            Technical: "bg-light-800",
            "AI Readiness": "bg-light-900",
        }[normalizedType] || "bg-light-600";

    const formattedDate = dayjs(
        interview?.createdAt || createdAt || Date.now()
    ).format("MMM D, YYYY h:mm A");

    return (
        <div className="card-border w-[360px] max-sm:w-full min-h-96">
            <div className="card-interview">
                <div>
                    {/* Type Badge */}
                    <div className={`absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg ${badgeColor}`}>
                        <p className="badge-text">{normalizedType}</p>
                    </div>

                    {/* Incomplete Badge - only show if interview exists and is not finalized */}
                    {interview && !interview.finalized && (
                        <div className="absolute top-12 right-0 w-fit px-4 py-2 rounded-bl-lg bg-orange-500">
                            <p className="badge-text">Incomplete Audit</p>
                        </div>
                    )}

                    {/* Fixed Logo Image */}
                    <Image
                        src="/logo.png"
                        alt="SingularShift Logo"
                        width={80} // adjust as needed
                        height={80} // adjust as needed
                        className="w-auto h-auto max-w-[100px] max-h-[100px]"
                    />


                    {/* Interview Role */}
                    <h3 className="mt-5 capitalize">
                        {type === "AI Readiness"
                            ? "AI Readiness Audit Report"
                            : `${role} Interview`}
                    </h3>

                    {/* Date & Score */}
                    <div className="flex flex-row gap-5 mt-3">
                        <div className="flex flex-row gap-2">
                            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
                            <p>{formattedDate}</p>
                        </div>

                        <div className="flex flex-row gap-2 items-center">
                            <Image src="/star.svg" width={22} height={22} alt="star" />
                            <p>{interview?.readinessScore ?? "---"}/100</p>
                        </div>
                    </div>

                    {/* Summary Line */}
                    <p className="line-clamp-2 mt-5">
                        {interview && !interview.finalized 
                            ? "This audit was not completed. Consider starting a new interview."
                            : "View your report to explore tailored AI suggestions."}
                    </p>
                </div>

                <div className="flex flex-row justify-between">
                    {interview?.finalized ? (
                        <Button className="btn-primary">
                            <Link href={`/interview/${interviewId}/feedback`}>
                                View Report
                            </Link>
                        </Button>
                    ) : interview && (
                        <Button className="btn-secondary">
                            <Link href="/interview">
                                Restart Audit
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InterviewCard;
