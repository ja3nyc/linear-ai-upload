import { authOptions } from "@/lib/auth";
import { LinearService } from "@/services/linear-service";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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

        // Parse the request body
        const data = await req.json();
        const { teamId, title, description, priority = 2, tags = [], projectId, assigneeId, labelIds, stateId } = data;

        // Validate required fields
        if (!teamId) {
            console.error("Missing teamId in request");
            return NextResponse.json(
                { error: "Team ID is required" },
                { status: 400 }
            );
        }

        if (!title) {
            console.error("Missing title in request");
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        if (!description) {
            console.error("Missing description in request");
            return NextResponse.json(
                { error: "Description is required" },
                { status: 400 }
            );
        }

        // Log parameters for debugging
        console.log("Creating issue with params:", {
            teamId,
            title: title.substring(0, 50) + (title.length > 50 ? '...' : ''),
            descriptionLength: description.length,
            priority,
            tagsCount: tags.length,
            projectId: projectId || "none",
            assigneeId: assigneeId || "none",
            labelIds: labelIds ? `${labelIds.length} label(s)` : "none",
            stateId: stateId || "none"
        });

        // Initialize the Linear service with the user's access token
        const linearService = new LinearService(session.accessToken);

        // Create the issue in Linear
        const issue = await linearService.createIssue(
            teamId,
            title,
            description,
            priority,
            tags,
            projectId,
            assigneeId,
            labelIds,
            stateId
        );

        // Return the created issue
        return NextResponse.json({ issue });
    } catch (error) {
        console.error("Error creating issue:", error);
        return NextResponse.json(
            { error: `Failed to create issue in Linear: ${(error as Error).message}` },
            { status: 500 }
        );
    }
} 