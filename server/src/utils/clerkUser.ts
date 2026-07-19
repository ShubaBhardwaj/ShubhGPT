import { clerkClient } from "../config/clerk";

/**
 * Shape of the extracted Clerk user profile.
 * Contains only the fields the application cares about.
 */
export interface ClerkUserProfile {
  clerkId: string;
  email: string;
  username: string;
  imageUrl: string;
}

/**
 * Fetch a Clerk user by their Clerk User ID and extract the relevant profile fields.
 *
 * This is the single source of truth for user profile information.
 * Any endpoint that needs the latest username, email, or imageUrl should
 * call this helper instead of reading potentially stale data from MongoDB.
 *
 * @param clerkUserId - The Clerk user ID (from the verified JWT).
 * @returns The extracted profile fields.
 * @throws If the Clerk user has no email address.
 */
export async function fetchClerkUser(
  clerkUserId: string
): Promise<ClerkUserProfile> {
  const user = await clerkClient.users.getUser(clerkUserId);

  // Prefer the primary email address; fall back gracefully.
  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error(`Clerk user ${clerkUserId} has no email address.`);
  }

  // Use Clerk's username if set; fall back to the part before the @ in the email.
  const username = user.username ?? email.split("@")[0];

  return {
    clerkId: user.id,
    email,
    username,
    imageUrl: user.imageUrl ?? "",
  };
}
