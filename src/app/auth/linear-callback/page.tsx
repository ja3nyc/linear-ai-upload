"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// Create a separate client component that uses useSearchParams
function LinearCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleSignIn = async () => {
            try {
                // Get user info from URL params
                const id = searchParams.get("id");
                const name = searchParams.get("name");
                const email = searchParams.get("email");
                const image = searchParams.get("image");
                const accessToken = searchParams.get("accessToken");

                if (!id || !name || !email) {
                    setError("Missing user information in URL parameters");
                    setLoading(false);
                    return;
                }

                if (!accessToken) {
                    setError("Missing access token in URL parameters");
                    setLoading(false);
                    return;
                }

                console.log("Signing in with Linear credentials");

                // Call the credentials provider with the user info and access token
                const result = await signIn("credentials", {
                    id,
                    name,
                    email,
                    image: image || "",
                    accessToken,
                    redirect: true,
                    callbackUrl: "/"
                });

                // This shouldn't execute unless redirect is false
                if (result?.error) {
                    setError(result.error);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error in LinearCallback:", error);
                setError("Authentication failed. Please try again.");
                setLoading(false);
            }
        };

        handleSignIn();
    }, [searchParams, router]);

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-8">
                <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
                    <div className="flex items-center justify-center mb-4">
                        <Image
                            src="/logo-dark.svg"
                            alt="Linear Logo"
                            width={40}
                            height={40}
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
                    <p className="text-gray-700 mb-4">{error}</p>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={() => router.push("/")}
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
                <div className="flex items-center justify-center mb-4">
                    <Image
                        src="/logo-dark.svg"
                        alt="Linear Logo"
                        width={40}
                        height={40}
                    />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Authenticating...</h2>
                <p className="text-gray-600 mb-4">Please wait while we complete your sign-in.</p>
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            </div>
        </div>
    );
}

// Main component that wraps the content with Suspense
export default function LinearCallback() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen flex-col items-center justify-center p-8">
                <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
                    <div className="flex items-center justify-center mb-4">
                        <Image
                            src="/logo-dark.svg"
                            alt="Linear Logo"
                            width={40}
                            height={40}
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading...</h2>
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                </div>
            </div>
        }>
            <LinearCallbackContent />
        </Suspense>
    );
} 