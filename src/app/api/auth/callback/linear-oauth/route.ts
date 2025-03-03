import { getBaseUrl } from "@/utils/urlHelpers";
import { LinearClient } from "@linear/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // Get authorization code from URL
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const baseUrl = getBaseUrl();

        if (!code) {
            return NextResponse.redirect(
                new URL(`${baseUrl}/?error=NoCodeProvided`)
            );
        }

        console.log("Received Linear OAuth code");

        // Exchange code for token
        const tokenUrl = "https://api.linear.app/oauth/token";

        // Use the utility function to get the base URL
        const redirectUri = `${baseUrl}/api/auth/callback/linear-oauth`;

        // Create form data for x-www-form-urlencoded content
        const formData = new URLSearchParams();
        formData.append("client_id", process.env.LINEAR_CLIENT_ID || "");
        formData.append("client_secret", process.env.LINEAR_CLIENT_SECRET || "");
        formData.append("redirect_uri", redirectUri);
        formData.append("grant_type", "authorization_code");
        formData.append("code", code);

        console.log("Exchanging code for token with Linear...");

        // Exchange code for token using x-www-form-urlencoded format
        const tokenResponse = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData.toString()
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error("Token exchange failed:", tokenResponse.status, errorText);
            return NextResponse.redirect(
                new URL(`${baseUrl}/?error=TokenExchangeFailed&details=${encodeURIComponent(errorText)}`)
            );
        }

        console.log("Successfully received token from Linear");

        // Parse token response
        const tokens = await tokenResponse.json();
        if (!tokens.access_token) {
            console.error("No access token in response");
            return NextResponse.redirect(
                new URL(`${baseUrl}/?error=NoAccessToken`)
            );
        }

        console.log("Fetching user info from Linear API");

        // Get user info
        const linearClient = new LinearClient({ accessToken: tokens.access_token });
        const viewer = await linearClient.viewer;

        console.log("Successfully fetched user info:", viewer.name);

        // Prepare user info for the callback page, including the access token
        const params = new URLSearchParams({
            id: viewer.id,
            name: viewer.name,
            email: viewer.email || "",
            image: viewer.avatarUrl || "",
            accessToken: tokens.access_token // Pass token directly in URL params
        });

        console.log("Redirecting to linear-callback page");

        // Redirect to the auth callback page with all needed info in URL
        const response = NextResponse.redirect(
            new URL(`${baseUrl}/auth/linear-callback?${params.toString()}`)
        );

        return response;
    } catch (error) {
        console.error("Linear OAuth callback error:", error);
        const baseUrl = getBaseUrl();
        return NextResponse.redirect(
            new URL(`${baseUrl}/?error=AuthenticationFailed`)
        );
    }
} 