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

        const linearService = new LinearService(session.accessToken);
        const teams = await linearService.getTeams();

        return NextResponse.json({ teams });
    } catch (error) {
        console.error("Error fetching teams:", error);
        return NextResponse.json(
            { error: (error as Error).message || "Failed to fetch teams" },
            { status: 500 }
        );
    }
} 