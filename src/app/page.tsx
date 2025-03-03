"use client";

import ImageUploader from "@/components/image-uploader";
import { SessionProvider } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  return (
    <SessionProvider>
      <main
        className="flex min-h-screen flex-col items-center justify-center p-4"
        style={{
          backgroundColor: "var(--bg)",
          backgroundImage: "radial-gradient(var(--border) 2px, transparent 0)",
          backgroundSize: "30px 30px",
          backgroundPosition: "0 0, 15px 15px",
          backgroundAttachment: "fixed"
        }}
      >
        <Toaster position="top-center" />
        <div className="max-w-4xl w-full">
          <div className="mb-8 relative w-fit mx-auto">
            <div className="absolute inset-0 bg-[#000] translate-x-2 translate-y-2 rounded-base"></div>
            <div className="bg-[var(--main)] border-2 border-black py-2 px-6 rounded-base relative">
              <h1 className="text-2xl md:text-3xl font-bold text-center text-[var(--mtext)] flex items-center justify-center gap-3">
                <Image
                  src="/logo-dark.svg"
                  alt="Linear Logo"
                  width={32}
                  height={32}
                  className="inline-block"
                />
                Linear AI Issue Creator
              </h1>
            </div>
          </div>
          <AuthenticatedContent />
        </div>
      </main>
    </SessionProvider>
  );
}

function AuthenticatedContent() {
  const { data: session, status } = useSession();
  const [linearAuthUrl, setLinearAuthUrl] = useState("");

  // Generate Linear OAuth URL with custom redirect
  useEffect(() => {
    try {
      const clientId = process.env.NEXT_PUBLIC_LINEAR_CLIENT_ID;
      if (!clientId) {
        console.error("Missing LINEAR_CLIENT_ID environment variable");
        return;
      }

      const redirectUri = `${window.location.origin}/api/auth/callback/linear-oauth`;
      const state = Math.random().toString(36).substring(7);

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "read,write,issues:create",
        response_type: "code",
        state: state,
      });

      const url = `https://linear.app/oauth/authorize?${params.toString()}`;
      console.log("Generated Linear OAuth URL:", url);

      setLinearAuthUrl(url);
    } catch (error) {
      console.error("Error generating Linear OAuth URL:", error);
    }
  }, []);

  if (status === "loading") {
    return (
      <Card className="neo-card bg-white border-black shadow-none overflow-visible">
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-lg font-bold animate-pulse">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="neo-card bg-main border-black shadow-none overflow-visible">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Linear AI Issue Creator</CardTitle>
          <CardDescription className="text-lg">
            Sign in with Linear to create issues from image uploads using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 p-8">
          <div className="max-w-md text-center">
            <p className="mb-4 text-[var(--text)]">
              This application uses AI to analyze images and automatically create Linear issues based on the content.
            </p>
            <p className="text-[var(--text)]">
              Upload screenshots, diagrams, wireframes, or any visual content and let AI generate structured Linear issues.
            </p>
          </div>
          <Button
            onClick={() => {
              console.log("Redirecting to Linear OAuth:", linearAuthUrl);
              window.location.href = linearAuthUrl;
            }}
            size="lg"
            className="neo-button bg-white border-black text-black hover:bg-gray-50"
            disabled={!linearAuthUrl}
          >
            <span className="flex items-center gap-2">
              <Image
                src="/logo-dark.svg"
                alt="Linear Logo"
                width={24}
                height={24}
              />
              Sign in with Linear
            </span>
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center p-4 border-t border-black">
          <p className="text-sm font-bold">
            Powered by Google AI and Linear
          </p>
        </CardFooter>
      </Card>
    );
  }

  return <ImageUploader />;
}
