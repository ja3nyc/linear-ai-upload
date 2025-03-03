import { authOptions } from "@/lib/auth";
import { LinearService } from "@/services/linear-service";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.accessToken) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Get the teamId from query params if provided
        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get('teamId');

        // Fetch projects from Linear
        const linearService = new LinearService(session.accessToken);
        const projects = await linearService.getProjects(teamId || "");

        return NextResponse.json({ projects });
    } catch (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json(
            { error: (error as Error).message || "Failed to fetch projects" },
            { status: 500 }
        );
    }
} 