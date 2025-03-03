import { LinearClient } from "@linear/sdk";

export interface IssueCreationInput {
    title: string;
    description: string;
    teamId?: string;
}

export class LinearService {
    private client: LinearClient;

    constructor(accessToken: string) {
        this.client = new LinearClient({ accessToken });
    }

    /**
     * Get the authenticated user's information
     */
    async getViewer() {
        return await this.client.viewer;
    }

    /**
     * Get all teams accessible to the authenticated user
     */
    async getTeams() {
        return await this.client.teams();
    }

    /**
     * Create a new issue in Linear
     */
    async createIssue(input: IssueCreationInput) {
        // If no teamId is provided, fetch teams and use the first one
        let teamId = input.teamId;
        if (!teamId) {
            const teams = await this.getTeams();
            if (teams.nodes.length === 0) {
                throw new Error("No teams found");
            }
            teamId = teams.nodes[0].id;
        }

        // Create the issue
        const issue = await this.client.createIssue({
            title: input.title,
            description: input.description,
            teamId,
        });

        return issue;
    }
} 