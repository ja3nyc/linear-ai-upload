import { authOptions } from "@/lib/auth";
import { LinearService } from '@/services/linear-service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        // Check if user is authenticated
        const session = await getServerSession(authOptions);
        if (!session?.accessToken) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Get the teamId from query params
        const teamId = req.nextUrl.searchParams.get('teamId');
        if (!teamId) {
            return NextResponse.json({ error: "teamId is required" }, { status: 400 });
        }

        // Initialize the Linear service
        const linearService = new LinearService(session.accessToken);

        // Fetch labels
        const labels = await linearService.getLabels(teamId);

        return NextResponse.json(labels);
    } catch (error) {
        console.error("Error fetching labels:", error);
        return NextResponse.json(
            { error: `Failed to fetch labels: ${error}` },
            { status: 500 }
        );
    }
} 