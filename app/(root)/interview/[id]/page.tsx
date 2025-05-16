import Image from "next/image";
import { redirect } from "next/navigation";

import Agent from "@/components/Agent";
import { getRandomInterviewCover } from "@/lib/utils";
import {
  getInterviewById,
  getFeedbackByInterviewId,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import DisplayTechIcons from "@/components/DisplayTechIcons";

type RouteParams = { params: { id: string } };

const InterviewDetails = async ({ params }: RouteParams) => {
  const { id } = params;
  const user = await getCurrentUser();

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  await getFeedbackByInterviewId({ interviewId: id, userId: user?.id || "" });

  return (
      <>
        {/* header */}
        <div className="flex flex-row gap-4 justify-between">
          <div className="flex flex-row gap-4 items-center max-sm:flex-col">
            <div className="flex flex-row gap-4 items-center">
              <Image
                  src={getRandomInterviewCover()}
                  alt="cover-image"
                  width={40}
                  height={40}
                  className="rounded-full object-cover size-[40px]"
              />
              <h3 className="capitalize">{interview.role} Interview</h3>
            </div>
            <DisplayTechIcons techStack={interview.techstack} />
          </div>
          <p className="bg-dark-200 px-4 py-2 rounded-lg h-fit">{interview.type}</p>
        </div>

        {/* voice agent */}
          <Agent
              userName={user?.name || "Guest"}
              userId={user?.id || "anonymous"}
              interviewId={id}
              jobTitle={user?.jobTitle || ""}
              department={user?.department || ""}
              seniority={user?.seniority || ""}
              location={user?.location || ""}
          />
      </>
  );
};

export default InterviewDetails;
