import { LinearClient } from "@linear/sdk";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Define custom user type with accessToken
interface LinearUser {
    id: string;
    name: string;
    email: string;
    image?: string;
    accessToken?: string;
}

// Define the Linear OAuth provider
export const authOptions: NextAuthOptions = {
    providers: [
        {
            id: "linear",
            name: "Linear",
            type: "oauth",
            authorization: {
                url: "https://linear.app/oauth/authorize",
                params: { scope: "read,write,issues:create" }
            },
            token: {
                url: "https://api.linear.app/oauth/token",
                params: { grant_type: "authorization_code" }
            },
            userinfo: {
                async request({ tokens }) {
                    const linearClient = new LinearClient({ accessToken: tokens.access_token as string });
                    return await linearClient.viewer;
                }
            },
            profile(profile) {
                return {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    image: profile.avatarUrl,
                };
            },
            clientId: process.env.LINEAR_CLIENT_ID,
            clientSecret: process.env.LINEAR_CLIENT_SECRET,
        },
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                id: { type: "text" },
                name: { type: "text" },
                email: { type: "text" },
                image: { type: "text" },
                accessToken: { type: "text" },
            },
            async authorize(credentials) {
                // Check credentials
                if (!credentials?.id || !credentials?.name || !credentials?.email || !credentials?.accessToken) {
                    return null;
                }

                // Use the access token passed directly from credentials
                return {
                    id: credentials.id,
                    name: credentials.name,
                    email: credentials.email,
                    image: credentials.image,
                    accessToken: credentials.accessToken,
                } as LinearUser;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            // Add access token to JWT token
            if (account?.access_token) {
                token.accessToken = account.access_token;
            } else if (user && 'accessToken' in user) {
                token.accessToken = (user as LinearUser).accessToken;
            }
            return token;
        },
        async session({ session, token }) {
            // Add access token to session
            if (token.accessToken) {
                session.accessToken = token.accessToken as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/",
    },
    session: {
        strategy: "jwt",
    },
    debug: process.env.NODE_ENV === "development",
    secret: process.env.NEXTAUTH_SECRET,
}; 