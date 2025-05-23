"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

/* ──────────────────────────────────────────────────────────────
   Session handling helpers
   ──────────────────────────────────────────────────────────── */

const SESSION_DURATION = 60 * 60 * 24 * 7;           // 1 week (seconds)

export async function setSessionCookie(idToken: string) {
  const cookieStore = await cookies();

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION * 1000,               // ms
  });

  cookieStore.set("session", sessionCookie, {
    maxAge: SESSION_DURATION,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

/* ──────────────────────────────────────────────────────────────
   Sign-up
   ──────────────────────────────────────────────────────────── */

export async function signUp(params: SignUpParams) {
  const {
    uid,
    name,
    email,
    jobTitle,
    seniority,
    department,
    location,
  } = params;

  try {
    /* Check if user already exists */
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.exists) {
      return { success: false, message: "User already exists. Please sign in." };
    }

    /* Persist user doc */
    await db.collection("users").doc(uid).set({
      name,
      email,
      jobTitle: jobTitle ?? null,
      seniority: seniority ?? null,
      department: department ?? null,
      location: location ?? null,
      createdAt: Date.now(),
    });

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error: any) {
    console.error("Error creating user:", error);

    if (error.code === "auth/email-already-exists") {
      return { success: false, message: "This email is already in use" };
    }

    return { success: false, message: "Failed to create account. Please try again." };
  }
}

/* ──────────────────────────────────────────────────────────────
   Sign-in
   ──────────────────────────────────────────────────────────── */

export async function signIn(params: SignInParams) {
  const { email, idToken } = params;

  try {
    const userRecord = await auth.getUserByEmail(email);
    if (!userRecord) {
      return { success: false, message: "User does not exist. Create an account." };
    }

    await setSessionCookie(idToken);
    return { success: true, message: "Signed in." };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Failed to log into account. Please try again." };
  }
}

/* ──────────────────────────────────────────────────────────────
   Sign-out
   ──────────────────────────────────────────────────────────── */

export async function signOut() {
  const cookieStore = await cookies();          // ← add await
  cookieStore.delete("session");
}

/* ──────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────── */

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();          // ← add await
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await auth.verifySessionCookie(sessionCookie, true);

    const userSnap = await db.collection("users").doc(decoded.uid).get();
    if (!userSnap.exists) return null;

    return {
      id: userSnap.id,
      ...userSnap.data(),
    } as User;
  } catch (error) {
    console.error("Session verification error:", error);
    return null;                                     // invalid or expired
  }
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}
