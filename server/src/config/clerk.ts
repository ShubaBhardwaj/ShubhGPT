import { createClerkClient } from "@clerk/backend";

/**
 * Initialize the Clerk Backend SDK using the secret key from environment variables.
 * This client is used server-side to verify JWTs and fetch user details from Clerk.
 *
 * Required environment variable: CLERK_SECRET_KEY
 */
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});

export { clerkClient };
