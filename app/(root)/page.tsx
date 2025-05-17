import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";
import ExportTrainingData from "@/components/ExportTrainingData";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewsByUserId } from "@/lib/actions/general.action";


async function Home() {
  const user = await getCurrentUser();

  if (!user?.id) return null;

  const userInterviews = (await getInterviewsByUserId(user.id)) || [];
  const hasPastInterviews = userInterviews.length > 0;
  
  // Check if user is an admin based on email
  const isAdmin = user.email === process.env.ADMIN_EMAIL;


  return (
    <>
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Expose Hidden Inefficiencies. Surface Agent-Ready Use Cases.</h2>
          <p className="text-lg">
            Deploy AI voice agents across your team to uncover blind spots and generate a tactical AI roadmap in 24 hours.
          </p>

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/interview">Start Your AI Readiness Audit</Link>
          </Button>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={250}
          height={250}
          className="max-sm:hidden"
        />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Your AI Readiness Audit</h2>

        <div className="interviews-section">
          {hasPastInterviews ? (
            userInterviews?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>You haven&apos;t taken any interviews yet</p>
          )}
        </div>
      </section>
      
      {/* Admin Tools Section - Only visible to admins */}
      {isAdmin && (
        <section className="flex flex-col gap-6 mt-8">
          <h2>Admin Tools</h2>
          <div className="flex flex-wrap gap-4">
            <ExportTrainingData />
            {/* Add other admin tools here in the future */}
          </div>
        </section>
      )}
    </>
  );
}

export default Home;
