/* ──────────────────────────────────────────────────────────────
   Global type declarations
   ──────────────────────────────────────────────────────────── */

/* Profiling enums (kept in sync with AuthForm.tsx) */
type Seniority = "Executive" | "Senior" | "Mid-level" | "Junior";

type Department =
    | "Technology"
    | "Product"
    | "HR"
    | "Finance"
    | "Operations"
    | "Marketing";

/* UAE emirates (Location dropdown) */
type Emirate =
    | "Abu Dhabi"
    | "Dubai"
    | "Sharjah"
    | "Ajman"
    | "Umm Al Quwain"
    | "Ras Al Khaimah"
    | "Fujairah";

/* ──────────────────────────────────────────────────────────────
   AI-readiness / interview types
   ──────────────────────────────────────────────────────────── */

interface Feedback {
  id?: string;
  interviewId: string;
  userId?: string;
  totalScore?: number;
  benchmark?: string;
  recommendations?: string[];
  categoryScores?: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  strengths?: string[];
  areasForImprovement?: string[];
  finalAssessment?: string;
  createdAt: string;
}

interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;

  /* 🔥 AI-Readiness Audit fields */
  readinessScore?: number;
  benchmarkSummary?: string;
  recommendations?: string[];
  strengths?: string[];
  weaknesses?: string[];
}

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
}

/* ──────────────────────────────────────────────────────────────
   Auth-related types
   ──────────────────────────────────────────────────────────── */

interface SignInParams {
  email: string;
  idToken: string;
}

interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;

  /* Optional profiling fields collected at sign-up */
  jobTitle?: string;
  seniority?: Seniority;
  department?: Department;
  location?: Emirate;
}

/* User object returned by getCurrentUser() */
interface User {
  id: string;
  name: string;
  email: string;

  jobTitle?: string | null;
  seniority?: Seniority | null;
  department?: Department | null;
  location?: Emirate | null;
}

/* ──────────────────────────────────────────────────────────────
   UI / component props
   ──────────────────────────────────────────────────────────── */

interface InterviewCardProps {
  interviewId?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
}

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

type FormType = "sign-in" | "sign-up";

interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

interface TechIconProps {
  techStack: string[];
}
