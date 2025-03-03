import { authOptions } from "@/lib/auth";
import { LinearService } from "@/services/linear-service";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        // Check for an authenticated session
        const session = await getServerSession(authOptions);

        if (!session?.accessToken) {
            console.error("No access token found in session");
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Initialize the Linear service with the user's access token
        const linearService = new LinearService(session.accessToken);

        // Fetch users from Linear
        const users = await linearService.getUsers();

        // Return the users
        return NextResponse.json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: `Failed to fetch users: ${(error as Error).message}` },
            { status: 500 }
        );
    }
} 