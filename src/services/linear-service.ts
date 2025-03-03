import { LinearClient } from "@linear/sdk";

export interface LinearProject {
    id: string;
    name: string;
}

export interface LinearUser {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
}

export interface LinearLabel {
    id: string;
    name: string;
    color: string;
}

export interface LinearWorkflowState {
    id: string;
    name: string;
    color: string;
    type: string;
}

export class LinearService {
    private client: LinearClient;

    constructor(accessToken: string) {
        this.client = new LinearClient({
            apiKey: accessToken
        });
    }

    // Get all teams for the authenticated user
    async getTeams() {
        const { nodes: teams } = await this.client.teams();
        return teams.map(team => ({
            id: team.id,
            name: team.name,
            key: team.key,
        }));
    }

    // Get projects for a specific team
    async getProjects(teamId: string) {
        // First get the team
        const team = await this.client.team(teamId);

        // Then get the projects for that team
        const { nodes: projects } = await team.projects();

        return projects.map(project => ({
            id: project.id,
            name: project.name,
        }));
    }

    // Get users for the authenticated user's organization
    async getUsers() {
        const { nodes: users } = await this.client.users();
        return users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
        }));
    }

    async getLabels(teamId: string) {
        // First get the team
        const team = await this.client.team(teamId);

        // Then get the labels for that team
        const { nodes: labels } = await team.labels();

        return labels.map(label => ({
            id: label.id,
            name: label.name,
            color: label.color,
        }));
    }

    async getWorkflowStates(teamId: string) {
        // First get the team
        const team = await this.client.team(teamId);

        // Then get the workflow states for that team
        const { nodes: states } = await team.states();

        return states.map(state => ({
            id: state.id,
            name: state.name,
            color: state.color,
            type: state.type,
        }));
    }

    // Create a new issue in Linear
    async createIssue(
        teamId: string,
        title: string,
        description: string,
        priority: number = 2,
        tags: string[] = [],
        projectId?: string,
        assigneeId?: string,
        labelIds?: string[],
        stateId?: string
    ) {
        console.log('Creating issue with params:', { teamId, title, description, priority, tags, projectId, assigneeId, labelIds, stateId });

        // Verify existences of associated records
        let project = undefined;
        if (projectId) {
            try {
                project = await this.client.project(projectId);
                if (!project) {
                    console.warn(`Project with ID ${projectId} not found. Skipping project assignment.`);
                }
            } catch (error) {
                console.warn(`Error finding project with ID ${projectId}:`, error);
                console.warn('Skipping project assignment.');
            }
        }

        let user = undefined;
        if (assigneeId) {
            try {
                user = await this.client.user(assigneeId);
                if (!user) {
                    console.warn(`User with ID ${assigneeId} not found. Skipping user assignment.`);
                }
            } catch (error) {
                console.warn(`Error finding user with ID ${assigneeId}:`, error);
                console.warn('Skipping user assignment.');
            }
        }

        // Append tags to description if provided
        let finalDescription = description;
        if (tags && tags.length > 0) {
            finalDescription += `\n\n**Tags:** ${tags.join(', ')}`;
        }

        try {
            // Construct the input object
            const issueInput: any = {
                teamId,
                title,
                description: finalDescription,
                priority
            };

            // Only add validated fields
            if (project) {
                issueInput.projectId = projectId;
            }

            if (user) {
                issueInput.assigneeId = assigneeId;
            }

            if (labelIds && labelIds.length > 0) {
                issueInput.labelIds = labelIds;
            }

            if (stateId) {
                issueInput.stateId = stateId;
            }

            // Use the createIssue method provided by the SDK
            const issuePayload = await this.client.createIssue(issueInput);

            if (!issuePayload.success || !issuePayload.issue) {
                throw new Error("Failed to create issue");
            }

            // Get the issue details from the payload
            const createdIssue = await issuePayload.issue;

            return {
                id: createdIssue.id,
                title: createdIssue.title,
                url: createdIssue.url,
            };
        } catch (error) {
            console.error("Error creating issue:", error);
            throw new Error(`Failed to create issue: ${error}`);
        }
    }
} 