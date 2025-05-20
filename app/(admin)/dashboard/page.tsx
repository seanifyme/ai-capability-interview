import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import ExportTrainingData from "@/components/ExportTrainingData";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewsByUserId } from "@/lib/actions/general.action";

async function AdminDashboard() {
  const user = await getCurrentUser();

  // Check if user is admin
  if (!user?.email || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/");
  }

  // Get all interviews for admin view
  const allInterviews = (await getInterviewsByUserId(user.id)) || [];
  const hasInterviews = allInterviews.length > 0;

  return (
    <>
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Admin Dashboard</h2>
          <p className="text-lg">
            Manage your AI readiness platform, export training data, and monitor interview metrics.
          </p>

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/">Return to User Dashboard</Link>
          </Button>
        </div>

        <Image
          src="/robot.png"
          alt="admin-robot"
          width={250}
          height={250}
          className="max-sm:hidden"
        />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Admin Tools</h2>
        <div className="flex flex-wrap gap-4">
          <ExportTrainingData />
          {/* Add more admin tools here as needed */}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Interview Statistics</h2>
        <div className="card-border p-4">
          <div className="dark-gradient rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2 items-center justify-center p-4 bg-dark-200 rounded-lg">
                <h3 className="text-2xl font-bold text-primary-200">{allInterviews.length}</h3>
                <p>Total Interviews</p>
              </div>
              <div className="flex flex-col gap-2 items-center justify-center p-4 bg-dark-200 rounded-lg">
                <h3 className="text-2xl font-bold text-primary-200">
                  {allInterviews.filter(i => i.finalized).length}
                </h3>
                <p>Completed Interviews</p>
              </div>
              <div className="flex flex-col gap-2 items-center justify-center p-4 bg-dark-200 rounded-lg">
                <h3 className="text-2xl font-bold text-primary-200">
                  {allInterviews.filter(i => !i.finalized).length}
                </h3>
                <p>Pending Interviews</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default AdminDashboard; 