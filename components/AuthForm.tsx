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

/* ─── constants ─────────────────────────────────────────────── */
const SENIORITY_OPTIONS = ["Executive", "Senior", "Mid-level", "Junior"] as const;
const DEPARTMENT_OPTIONS = [
  "Technology",
  "Product",
  "HR",
  "Finance",
  "Operations",
  "Marketing",
] as const;
const EMIRATE_OPTIONS = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
] as const;

/* ─── dynamic form schema ───────────────────────────────────── */
const authFormSchema = (type: FormType) =>
    z.object({
      name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
      email: z.string().email(),
      password: z.string().min(3),

      /* optional profiling fields (10-second skip-able) */
      jobTitle: z.string().optional(),
      seniority: z.enum(SENIORITY_OPTIONS).optional(),
      department: z.enum(DEPARTMENT_OPTIONS).optional(),
      location: z.enum(EMIRATE_OPTIONS).optional(),
    });

/* ─── component ─────────────────────────────────────────────── */
const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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

  /* ── submit handler ─────────────────────────────────────── */
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
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

        /* Firebase auth */
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
        );

        /* Persist extra profile data */
        const result = await signUp({
          uid: userCredential.user.uid,
          name: name!,
          email,
          password, // still passed so our SignUpParams matches
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
        /* SIGN-IN flow */
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
    } catch (error) {
      console.error(error);
      toast.error(`There was an error: ${String(error)}`);
    }
  };

  const isSignIn = type === "sign-in";

  /* ── render ─────────────────────────────────────────────── */
  return (
      <div className="card-border lg:min-w-[566px]">
        <div className="flex flex-col gap-6 card py-14 px-10">
          {/* Brand */}
          <div className="flex items-center justify-center gap-2">
            <Image src="/logo.svg" alt="logo" height={32} width={38} />
            <h2 className="text-primary-100">SingularShift</h2>
          </div>

          <h3>Discover AI-agent opportunities inside your organisation</h3>

          <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="w-full space-y-6 mt-4 form"
            >
              {/* ── core fields ───────────────────────────── */}
              {!isSignIn && (
                  <FormField
                      control={form.control}
                      name="name"
                      label="Name"
                      placeholder="Your name"
                      type="text"
                  />
              )}

              <FormField
                  control={form.control}
                  name="email"
                  label="Email"
                  placeholder="your@email.com"
                  type="email"
              />

              <FormField
                  control={form.control}
                  name="password"
                  label="Password"
                  placeholder="Enter your password"
                  type="password"
              />

              {/* ── optional profiling fields (sign-up only) ───── */}
              {!isSignIn && (
                  <>
                    <FormField
                        control={form.control}
                        name="jobTitle"
                        label="Job title"
                        placeholder="e.g. CTO"
                        type="text"
                    />

                    <FormField
                        control={form.control}
                        name="seniority"
                        label="Seniority level"
                        type="select"
                        options={Array.from(SENIORITY_OPTIONS)}
                    />

                    <FormField
                        control={form.control}
                        name="department"
                        label="Department"
                        type="select"
                        options={Array.from(DEPARTMENT_OPTIONS)}
                    />

                    <FormField
                        control={form.control}
                        name="location"
                        label="Location (UAE emirate)"
                        type="select"
                        options={Array.from(EMIRATE_OPTIONS)}
                    />
                  </>
              )}

              <Button className="btn" type="submit">
                {isSignIn ? "Sign In" : "Create an Account"}
              </Button>
            </form>
          </Form>

          {/* switch link */}
          <p className="text-center">
            {isSignIn ? "No account yet?" : "Have an account already?"}
            <Link
                href={isSignIn ? "/sign-up" : "/sign-in"}
                className="font-bold text-user-primary ml-1"
            >
              {isSignIn ? "Sign Up" : "Sign In"}
            </Link>
          </p>
        </div>
      </div>
  );
};

export default AuthForm;
