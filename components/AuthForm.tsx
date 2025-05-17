/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { auth } from "@/firebase/client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import FormField from "./FormField";
import { signIn, signUp } from "@/lib/actions/auth.action";

/* ─── dropdown options (keep in sync with types/index.d.ts) ─── */
const SENIORITY = ["Executive", "Senior", "Mid-level", "Junior"] as const;
const DEPT = [
  "Technology",
  "Product",
  "HR",
  "Finance",
  "Operations",
  "Marketing",
] as const;
const EMIRATE = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
] as const;

/* ─── zod schema (dynamic) ──────────────────────────────────── */
const authFormSchema = (formType: FormType) =>
    z.object({
      name: formType === "sign-up" ? z.string().min(3) : z.string().optional(),
      email: z.string().email(),
      password: z.string().min(3),

      jobTitle: z.string().optional(),
      seniority: z.enum(SENIORITY).optional(),
      department: z.enum(DEPT).optional(),
      location: z.enum(EMIRATE).optional(),
    });

/* ─── component ─────────────────────────────────────────────── */
const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();

  const form = useForm<z.infer<ReturnType<typeof authFormSchema>>>({
    resolver: zodResolver(authFormSchema(type)),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      jobTitle: "",
      seniority: undefined,
      department: undefined,
      location: undefined,
    },
  });

  /* ─ submit handler ─ */
  const onSubmit = async (
      data: z.infer<ReturnType<typeof authFormSchema>>,
  ) => {
    try {
      if (type === "sign-up") {
        const {
          name,
          email,
          password,
          jobTitle,
          seniority,
          department,
          location,
        } = data;

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
        );

        const result = await signUp({
          uid: userCredential.user.uid,
          name: name!,
          email,
          password,
          jobTitle,
          seniority,
          department,
          location,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success("Account created successfully. Please sign in.");
        router.push("/sign-in");
      } else {
        const { email, password } = data;

        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password,
        );

        const idToken = await userCredential.user.getIdToken();
        if (!idToken) {
          toast.error("Sign in failed. Please try again.");
          return;
        }

        await signIn({ email, idToken });
        toast.success("Signed in successfully.");
        router.push("/");
      }
    } catch (err) {
      console.error(err);
      toast.error(`There was an error: ${String(err)}`);
    }
  };

  const isSignIn = type === "sign-in";

  /* ─── render ─────────────────────────────────────────────── */
  return (
      <div className="card-border max-w-xl mx-auto">
        <div className="card flex flex-col gap-5 p-8">
          {/* Brand */}
          <div className="flex items-center justify-center gap-2">
            <Image src="/logo.svg" alt="logo" width={32} height={28} />
            <h2 className="text-primary-100">SingularShift</h2>
          </div>

          <h3 className="text-xl text-center">Discover Where AI Agents Can Transform Your Organisation — in 24 Hours</h3>

          <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="w-full grid md:grid-cols-2 gap-4"
            >
              {/* Core fields (span 2 columns) */}
              {!isSignIn && (
                  <div className="col-span-2">
                    <FormField
                        control={form.control}
                        name="name"
                        label="Name"
                        placeholder="Your name"
                        type="text"
                    />
                  </div>
              )}

              <div className="col-span-2">
                <FormField
                    control={form.control}
                    name="email"
                    label="Email"
                    placeholder="you@email.com"
                    type="email"
                />
              </div>

              <div className="col-span-2">
                <FormField
                    control={form.control}
                    name="password"
                    label="Password"
                    placeholder="••••••••"
                    type="password"
                />
                <div className="mt-2 space-y-1.5 bg-white/5 p-2.5 rounded-lg">
                  <p className="text-xs text-white/70 font-medium">Password requirements:</p>
                  <ul className="text-xs text-white/60 list-disc list-inside space-y-0.5">
                    <li>At least 3 characters long</li>
                    <li>Mix of letters and numbers recommended</li>
                    <li>Special characters make it stronger</li>
                  </ul>
                </div>
              </div>

              {/* Profiling fields (each takes one column) */}
              {!isSignIn && (
                  <>
                    <div>
                      <FormField
                          control={form.control}
                          name="jobTitle"
                          label="Job Title"
                          placeholder="e.g. CTO"
                          type="text"
                      />
                    </div>
                    <div>
                      <FormField
                          control={form.control}
                          name="seniority"
                          label="Seniority"
                          type="select"
                          options={Array.from(SENIORITY)}
                      />
                    </div>
                    <div>
                      <FormField
                          control={form.control}
                          name="department"
                          label="Department"
                          type="select"
                          options={Array.from(DEPT)}
                      />
                    </div>
                    <div>
                      <FormField
                          control={form.control}
                          name="location"
                          label="Location"
                          type="select"
                          options={Array.from(EMIRATE)}
                      />
                    </div>
                  </>
              )}

              {/* Submit button full width */}
              <div className="col-span-2">
                <Button className="btn w-full bg-[#007FF4] hover:bg-[#0069CF] text-white cursor-pointer rounded-lg py-2.5" type="submit">
                  {isSignIn ? "Sign In" : "Create an Account"}
                </Button>
              </div>
            </form>
          </Form>

          {/* Switch link */}
          <p className="text-center text-sm">
            {isSignIn ? "No account yet?" : "Have an account already?"}
            <Link
                href={isSignIn ? "/sign-up" : "/sign-in"}
                className="font-bold text-[#007FF4] hover:text-[#0069CF] ml-2"
            >
              {isSignIn ? "Sign Up" : "Sign In"}
            </Link>
          </p>
        </div>
      </div>
  );
};

export default AuthForm;
