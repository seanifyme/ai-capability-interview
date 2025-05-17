// List of approved admin emails
export const ADMIN_EMAILS = [
  "sean@singularshift.com",
  "connor@singularshift.com", 
  "mo@singularshift.com"
];

// Helper function to check if a user is an admin
export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
} 