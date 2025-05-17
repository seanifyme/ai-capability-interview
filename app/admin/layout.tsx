import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { isAdmin } from "@/lib/auth-utils";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Add authentication check
  const user = await getCurrentUser();
  
  // Check if user is admin
  if (!isAdmin(user?.email)) {
    redirect("/");
  }
  
  return (
    <div className="flex mx-auto max-w-7xl flex-col gap-12 my-12 px-16 max-sm:px-4 max-sm:my-8">
      {/* Admin header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" width={40} height={40} alt="SingularShift Logo" />
              <h1 className="text-xl font-bold">SingularShift</h1>
            </div>
          </Link>
          <div className="bg-primary-200 text-dark-100 px-3 py-1 rounded-full text-sm font-semibold">
            Admin Area
          </div>
        </div>
        <nav>
          <ul className="flex gap-6 items-center">
            <li>
              <Link href="/" className="text-light-100 hover:text-primary-200">
                User Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/dashboard" className="text-light-100 hover:text-primary-200">
                Admin Dashboard
              </Link>
            </li>
            <li>
              <LogoutButton />
            </li>
          </ul>
        </nav>
      </header>

      {/* Main content */}
      {children}
    </div>
  );
} 