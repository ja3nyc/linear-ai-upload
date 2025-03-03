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

        // Fetch teams first
        const teams = await linearService.getTeams();

        // Fetch users in parallel with teams
        const users = await linearService.getUsers();

        // Initialize container for team-specific data
        const teamsData = [];

        // For each team, fetch their projects, labels, and states
        for (const team of teams) {
            try {
                // Fetch projects, labels, and states in parallel for each team
                const [projects, labels, states] = await Promise.all([
                    linearService.getProjects(team.id),
                    linearService.getLabels(team.id),
                    linearService.getWorkflowStates(team.id)
                ]);

                teamsData.push({
                    teamId: team.id,
                    projects,
                    labels,
                    states
                });
            } catch (error) {
                console.error(`Error fetching data for team ${team.name}:`, error);
                // Still add the team but with empty data
                teamsData.push({
                    teamId: team.id,
                    projects: [],
                    labels: [],
                    states: []
                });
            }
        }

        // Return all data in a single response
        return NextResponse.json({
            teams,
            users,
            teamsData
        });
    } catch (error) {
        console.error("Error fetching all data:", error);
        return NextResponse.json(
            { error: (error as Error).message || "Failed to fetch data" },
            { status: 500 }
        );
    }
} 