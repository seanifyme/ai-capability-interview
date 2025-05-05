import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";

import { Button } from "./ui/button";
import DisplayTechIcons from "./DisplayTechIcons";

import { cn, getRandomInterviewCover } from "@/lib/utils";
import { getFeedbackByInterviewId } from "@/lib/actions/general.action";

// 👇 Override Feedback type to include readinessScore
type FeedbackWithReadiness = {
  readinessScore?: number;
  createdAt?: string;
};

const InterviewCard = async ({
                               interviewId,
                               userId,
                               role,
                               type,
                               techstack,
                               createdAt,
                             }: InterviewCardProps) => {
  const rawFeedback =
      userId && interviewId
          ? await getFeedbackByInterviewId({
            interviewId,
            userId,
          })
          : null;

  const feedback = rawFeedback as FeedbackWithReadiness;

  const normalizedType = /mix/gi.test(type) ? "Mixed" : type;

  const badgeColor =
      {
        Behavioral: "bg-light-400",
        Mixed: "bg-light-600",
        Technical: "bg-light-800",
      }[normalizedType] || "bg-light-600";

  const formattedDate = dayjs(
      feedback?.createdAt || createdAt || Date.now()
  ).format("MMM D, YYYY");

  return (
      <div className="card-border w-[360px] max-sm:w-full min-h-96">
        <div className="card-interview">
          <div>
            {/* Type Badge */}
            <div
                className={cn(
                    "absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg",
                    badgeColor
                )}
            >
              <p className="badge-text ">{normalizedType}</p>
            </div>

            {/* Cover Image */}
            <Image
                src={getRandomInterviewCover()}
                alt="cover-image"
                width={90}
                height={90}
                className="rounded-full object-fit size-[90px]"
            />

            {/* Interview Role */}
            <h3 className="mt-5 capitalize">
              {type === "AI Readiness" ? "Your AI Readiness Audit Report" : `${role} Interview`}
            </h3>

            {/* Date & Score */}
            <div className="flex flex-row gap-5 mt-3">
              <div className="flex flex-row gap-2">
                <Image
                    src="/calendar.svg"
                    width={22}
                    height={22}
                    alt="calendar"
                />
                <p>{formattedDate}</p>
              </div>

              <div className="flex flex-row gap-2 items-center">
                <Image src="/star.svg" width={22} height={22} alt="star" />
                <p>{feedback?.readinessScore ?? "---"}/100</p>
              </div>
            </div>

            {/* Placeholder Text */}
            <p className="line-clamp-2 mt-5">
              Your AI Readiness Audit is complete. View your report to explore tailored AI suggestions.
            </p>
          </div>

          <div className="flex flex-row justify-between">
            <DisplayTechIcons techStack={techstack} />

            <Button className="btn-primary">
              <Link href={`/interview/${interviewId}/feedback`}>
                View Report
              </Link>
            </Button>
          </div>
        </div>
      </div>
  );
};

export default InterviewCard;
