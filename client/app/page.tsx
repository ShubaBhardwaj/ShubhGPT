"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // Redirect signed-in users away from home page to /dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  if (isLoaded && isSignedIn) {
    return (
      <div className="flex-1 w-full flex items-center justify-center bg-[#FAF7F2] dark:bg-[#1A1816] h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex-1 w-full min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-[#FAF7F2] to-[#F5ECE0] dark:from-[#1A1816] dark:to-[#11100F] transition-colors duration-300 relative overflow-hidden">
      {/* Background Decorative Ambient Gradients */}
      <div className="absolute top-0 right-0 -z-10 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-20 left-0 -z-10 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-orange-400/5 blur-[100px] pointer-events-none" />

      <div className="flex flex-col items-center justify-center text-center space-y-8 max-w-md w-full z-10">
        {/* Welcome Text */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent font-heading">
          Welcome to ShubhGPT
        </h1>

        {/* Action Buttons */}
        <div className="w-full flex flex-col items-center justify-center">
          {isLoaded ? (
            <div className="flex items-center gap-4">
              <SignInButton mode="modal">
                <Button
                  variant="outline"
                  className="rounded-full px-8 py-5 border-2 border-primary/20 hover:border-primary/50 text-sm font-semibold transition-all duration-300 w-32 cursor-pointer"
                >
                  Sign In
                </Button>
              </SignInButton>

              <SignUpButton mode="modal">
                <Button className="rounded-full px-8 py-5 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold transition-all duration-300 w-32 cursor-pointer shadow-md shadow-primary/20">
                  Sign Up
                </Button>
              </SignUpButton>
            </div>
          ) : (
            <div className="h-10 flex items-center justify-center">
              <Loader2 className="size-5 animate-spin text-primary/50" />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
