import { Request, Response, NextFunction } from "express";
import { clerkClient } from "../config/clerk";

/**
 * Extend Express's Request interface to carry the authenticated Clerk User ID.
 * This ensures TypeScript knows `req.auth` is populated after this middleware runs.
 */
declare global {
  namespace Express {
    interface Request {
      auth?: {
        clerkUserId: string;
      };
    }
  }
}

/**
 * Clerk JWT Authentication Middleware.
 *
 * Workflow:
 * 1. Extract the Bearer token from the Authorization header.
 * 2. Verify the token using Clerk's Backend SDK (authenticateRequest).
 * 3. If invalid or missing, reject with 401 Unauthorized.
 * 4. If valid, attach the resolved Clerk User ID to `req.auth` and proceed.
 */
const clerkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log(`[clerkAuth] Incoming request to ${req.method} ${req.originalUrl}`);
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: Missing or malformed Authorization header.",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    // Use Clerk's authenticateRequest to verify the token.
    // We construct a minimal Request-like object that Clerk's SDK accepts.
    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:8000";
    const absoluteUrl = `${protocol}://${host}${req.originalUrl || req.url}`;

    // Map Express headers to standard Headers object
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(val => headers.append(key, val));
        } else {
          headers.set(key, value);
        }
      }
    });

    const requestState = await clerkClient.authenticateRequest({
      headers,
      method: req.method,
      url: absoluteUrl,
    } as any);

    if (!requestState.isAuthenticated) {
      console.error("[clerkAuth] Auth failed. Reason:", requestState.message, "Reason details:", requestState.reason);
      res.status(401).json({
        success: false,
        message: `Unauthorized: Invalid or expired token. Reason: ${requestState.message}`,
      });
      return;
    }

    // Attach the verified Clerk User ID to the request for downstream handlers.
    req.auth = {
      clerkUserId: (requestState.toAuth() as any).userId,
    };

    next();
  } catch (error) {
    const message = (error as Error).message ?? "Authentication failed.";
    console.error("[clerkAuth] Exception caught during authentication:", error);
    res.status(401).json({
      success: false,
      message: `Unauthorized: ${message}`,
    });
  }
};

export default clerkAuth;
