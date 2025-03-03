import { createGoogleGenerativeAI, google } from '@ai-sdk/google';
import { generateObject, generateText, Output } from 'ai';
import { z } from 'zod';

export class GoogleAIService {
    private apiKey: string;
    private googleAI: typeof google;

    // Define single issue schema
    private issueSchema = z.object({
        title: z.string().describe("A clear, concise title for the issue"),
        description: z.string().describe("A detailed description of the content formatted in Markdown. Use headings, lists, bold, italics, and code blocks as appropriate to structure the content."),
        priority: z.enum(["P0", "P1", "P2", "P3"]).describe("Priority level: P0 (highest), P1 (high), P2 (medium), or P3 (low)"),
        tags: z.array(z.string()).describe("1-3 relevant tags for categorizing this issue")
    });

    // Define multiple issues schema
    private multiIssueSchema = z.array(this.issueSchema).describe(
        "An array of issues identified in the content. IMPORTANT: Balance consolidation with separation - group closely related problems with the same root cause into a single issue, but create separate issues for distinct problems with different causes or requiring different solutions. Keep issues focused and actionable."
    );

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        // Create a custom provider instance with the API key
        this.googleAI = createGoogleGenerativeAI({
            apiKey: this.apiKey
        });
    }

    async analyzeImage(imageBase64: string, titleFormat: string = "") {
        try {
            // Extract the base64 data part if it's a data URL
            let base64Data = imageBase64;
            if (imageBase64.startsWith('data:')) {
                // Extract MIME type if available
                const mimeType = imageBase64.split(',')[0].split(':')[1].split(';')[0];
                base64Data = imageBase64.split(',')[1];

                // Convert base64 back to binary buffer
                const binaryData = Buffer.from(base64Data, 'base64');

                // Create format instructions based on titleFormat
                const formatInstructions = this.getTitleFormatInstructions(titleFormat);

                // Use the file input feature of the Google AI SDK with structured output
                const { experimental_output } = await generateText({
                    model: this.googleAI('gemini-2.0-flash'),
                    experimental_output: Output.object({
                        schema: this.multiIssueSchema
                    }),
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: `Analyze this image and generate structured issues for a project management tool.
                                    
                                    IMPORTANT BALANCED GROUPING GUIDELINES:
                                    - Group issues with SAME ROOT CAUSE or that require the SAME SOLUTION
                                    - Create separate issues when problems:
                                      * Affect different components or systems
                                      * Have different root causes
                                      * Would be fixed by different developers
                                      * Would be fixed at different times
                                    - For UI issues: group elements that appear in the same section/panel
                                    - For functionality issues: separate by feature or interaction type
                                    - If you cannot identify any clear issues, return an empty array
                                    
                                    ${formatInstructions}
                                    
                                    For EACH issue, extract:
                                    1. Title: ${titleFormat
                                            ? 'Format using the pattern described above (e.g., "bug(ui): Button alignment issue")'
                                            : 'Clear, concise title that reflects the consolidated issue'}
                                    2. Description: Detailed description that includes ALL related aspects grouped into this issue. Format using Markdown with:
                                       - Use ## and ### for section headings
                                       - Use **bold** for emphasis and important points
                                       - Use bullet lists and numbered lists for steps or multiple points
                                       - Use \`code\` formatting for code snippets, selectors, or technical terms
                                       - Use > blockquotes for highlighting important notes
                                    3. Priority: P0 (highest), P1 (high), P2 (medium), or P3 (low)
                                    4. Tags: 1-3 relevant tags`
                                },
                                {
                                    type: 'file',
                                    data: binaryData,
                                    mimeType: mimeType,
                                }
                            ]
                        }
                    ]
                });

                // If no issues were found or output wasn't generated, return empty array
                if (!experimental_output || experimental_output.length === 0) {
                    return [];
                }

                // Process each issue to convert priority strings to numeric values and apply title format
                return experimental_output.map((issue: any) => {
                    let priorityValue = 2; // Default to P2 (medium)
                    switch (issue.priority) {
                        case "P0": priorityValue = 0; break;
                        case "P1": priorityValue = 1; break;
                        case "P3": priorityValue = 3; break;
                    }

                    // Apply title format to the title if it's provided
                    let formattedTitle = issue.title;
                    if (titleFormat && !this.titleFollowsFormat(formattedTitle, titleFormat)) {
                        formattedTitle = this.applyTitleFormat(formattedTitle, titleFormat);
                    }

                    return {
                        title: formattedTitle,
                        description: issue.description,
                        priority: priorityValue,
                        tags: issue.tags
                    };
                });
            } else {
                throw new Error("Invalid image format. Expected data URL.");
            }
        } catch (error) {
            console.error('Error analyzing image:', error);
            return [{
                title: "Error Analyzing Image",
                description: "There was an error analyzing the image. Please try again with a different image.",
                priority: 2,
                tags: ["error", "image-analysis"],
            }];
        }
    }

    async analyzePDF(pdfBase64: string, titleFormat: string = "") {
        try {
            // Extract the base64 data part if it's a data URL
            let base64Data = pdfBase64;
            if (pdfBase64.startsWith('data:')) {
                base64Data = pdfBase64.split(',')[1];
            }

            // Convert base64 back to binary buffer
            const binaryData = Buffer.from(base64Data, 'base64');

            // Create format instructions based on titleFormat
            const formatInstructions = this.getTitleFormatInstructions(titleFormat);

            // Use the file input feature of the Google AI SDK with structured output
            const { experimental_output } = await generateText({
                model: this.googleAI('gemini-2.0-flash'),
                experimental_output: Output.object({
                    schema: this.multiIssueSchema
                }),
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Analyze this PDF document and generate structured issues for a project management tool.
                                
                                IMPORTANT BALANCED GROUPING GUIDELINES:
                                - Group issues with SAME ROOT CAUSE or that require the SAME SOLUTION
                                - Create separate issues when problems:
                                  * Affect different sections of the document
                                  * Have different root causes
                                  * Would be fixed by different teams or processes
                                  * Would be addressed in different development phases
                                - For document formatting: group similar formatting issues together
                                - For content issues: separate by topic, section, or information type
                                - If you cannot identify any clear issues, return an empty array
                                
                                ${formatInstructions}
                                
                                For EACH issue, extract:
                                1. Title: ${titleFormat
                                        ? 'Format using the pattern described above (e.g., "bug(ui): Button alignment issue")'
                                        : 'Clear, concise title that reflects the consolidated issue'}
                                2. Description: Detailed description that includes ALL related aspects grouped into this issue. Format using Markdown with:
                                   - Use ## and ### for section headings
                                   - Use **bold** for emphasis and important points
                                   - Use bullet lists and numbered lists for steps or multiple points
                                   - Use \`code\` formatting for code snippets, selectors, or technical terms
                                   - Use > blockquotes for highlighting important notes
                                3. Priority: P0 (highest), P1 (high), P2 (medium), or P3 (low)
                                4. Tags: 1-3 relevant tags`
                            },
                            {
                                type: 'file',
                                data: binaryData,
                                mimeType: 'application/pdf',
                            }
                        ]
                    }
                ]
            });

            // If no issues were found or output wasn't generated, return empty array
            if (!experimental_output || experimental_output.length === 0) {
                return [];
            }

            // Process each issue to convert priority strings to numeric values and apply title format
            return experimental_output.map((issue: any) => {
                let priorityValue = 2; // Default to P2 (medium)
                switch (issue.priority) {
                    case "P0": priorityValue = 0; break;
                    case "P1": priorityValue = 1; break;
                    case "P3": priorityValue = 3; break;
                }

                // Apply title format to the title if it's provided
                let formattedTitle = issue.title;
                if (titleFormat && !this.titleFollowsFormat(formattedTitle, titleFormat)) {
                    formattedTitle = this.applyTitleFormat(formattedTitle, titleFormat);
                }

                return {
                    title: formattedTitle,
                    description: issue.description,
                    priority: priorityValue,
                    tags: issue.tags
                };
            });
        } catch (error) {
            console.error('Error analyzing PDF:', error);
            return [{
                title: "Error Analyzing PDF",
                description: "There was an error analyzing the PDF. Please try again with a different PDF or extract the text manually and paste it in the text input area.",
                priority: 2,
                tags: ["error", "pdf-analysis"],
            }];
        }
    }

    async analyzeText(text: string, titleFormat: string = "") {
        try {
            // Use generateObject for structured data generation with multiple issues
            const formatInstructions = this.getTitleFormatInstructions(titleFormat);

            const { object } = await generateObject({
                model: this.googleAI('gemini-2.0-flash'),
                schema: this.multiIssueSchema,
                schemaName: "Issues",
                schemaDescription: "Array of structured data for project management issues. STRONGLY PREFER CONSOLIDATION of related issues. Return an empty array if no issues are found.",
                prompt: `Analyze this text and generate structured issues for a project management tool.

                IMPORTANT BALANCED GROUPING GUIDELINES:
                - Group issues that share the SAME ROOT CAUSE or require the SAME SOLUTION
                - Create separate issues when problems:
                  * Relate to different functional areas
                  * Have different underlying causes
                  * Would be assigned to different people or teams
                  * Have fundamentally different priorities or impact
                - Balance between having too many small issues and too few large issues
                - If you cannot identify any clear issues or the text doesn't contain enough information,
                it's completely acceptable to return an empty array instead of forcing an issue creation.
                
                ${formatInstructions}
                
                When creating titles for issues, ${titleFormat ? 'follow the title format described above' : 'make them clear and concise, reflecting the consolidated issue'}.
                When creating descriptions, be comprehensive and include ALL related aspects that are grouped into this issue.
                Format descriptions using Markdown with:
                - Use ## and ### for section headings
                - Use **bold** for emphasis and important points
                - Use bullet lists and numbered lists for steps or multiple points
                - Use \`code\` formatting for code snippets, selectors, or technical terms
                - Use > blockquotes for highlighting important notes

                Text to analyze: ${text}`
            });

            // If no issues were found, return empty array
            if (!object || object.length === 0) {
                return [];
            }

            // Process each issue to convert priority strings to numeric values
            return object.map((issue: any) => {
                let priorityValue = 2; // Default to P2 (medium)
                switch (issue.priority) {
                    case "P0": priorityValue = 0; break;
                    case "P1": priorityValue = 1; break;
                    case "P3": priorityValue = 3; break;
                }

                // Apply title format to the title if it's provided
                let formattedTitle = issue.title;
                if (titleFormat && !this.titleFollowsFormat(formattedTitle, titleFormat)) {
                    formattedTitle = this.applyTitleFormat(formattedTitle, titleFormat);
                }

                return {
                    title: formattedTitle,
                    description: issue.description,
                    priority: priorityValue,
                    tags: issue.tags
                };
            });
        } catch (error) {
            console.error('Error analyzing text:', error);
            return [{
                title: "Error Analyzing Text",
                description: "There was an error analyzing the text. Please try again with different text.",
                priority: 2,
                tags: ["error", "text-analysis"],
            }];
        }
    }

    // Helper method to generate title format instructions
    private getTitleFormatInstructions(titleFormat: string): string {
        if (!titleFormat) return '';

        // Clean up the format string - handle comma-separated examples
        const formats = titleFormat.split(',').map(f => f.trim()).filter(f => f);
        if (formats.length === 0) return '';

        const primaryFormat = formats[0];
        const examples = formats.map(f => `"${f}"`).join(', ');

        return `TITLE FORMAT INSTRUCTIONS:
        Please format all issue titles following one of these patterns: ${examples}
        Choose the most appropriate type (feat, bug, chore, etc.) based on the issue content.
        The text within parentheses should indicate the area or component affected.
        The text after the colon should be the main title content.
        
        Examples:
        - If the issue is a new feature for the portfolio area, use: "feat(portfolio): [Your Title Here]"
        - If it's a bug in the API, use: "bug(api): [Your Title Here]"
        - If it's a refactoring task, use: "refactor(component): [Your Title Here]"
        `;
    }

    // Helper method to apply title format to a title
    private applyTitleFormat(title: string, format: string): string {
        // If the title already contains a pattern like "type(area):", don't modify it
        if (title.match(/^[a-z]+\([a-z0-9_-]+\):/i)) {
            return title;
        }

        // Handle comma-separated list of formats by taking the first one
        const primaryFormat = format.split(',')[0].trim();

        if (!primaryFormat.includes('(') || !primaryFormat.includes(')') || !primaryFormat.includes(':')) {
            return title; // Format doesn't match expected pattern
        }

        try {
            // Extract format parts
            const typePrefix = primaryFormat.split('(')[0].trim(); // e.g. "feat" or "bug"
            const area = primaryFormat.split('(')[1].split(')')[0].trim(); // Extract area from format

            // Replace placeholder words with actual content
            return `${typePrefix}(${area}): ${title}`;
        } catch (error) {
            console.error('Error applying title format:', error);
            return title; // Return original if format fails
        }
    }

    // Helper method to check if a title already follows the format
    private titleFollowsFormat(title: string, format: string): boolean {
        // If the title starts with a pattern like "type(area):", consider it formatted
        return !!title.match(/^[a-z]+\([a-z0-9_-]+\):/i);
    }

    // For parsing text responses from image analysis with multiple issues
    private parseMultipleIssuesResponse(text: string, titleFormat: string = "") {
        console.log("Parsing multi-issue response:", text);

        // Check for NO ISSUES FOUND response
        if (text.includes("NO ISSUES FOUND")) {
            return [];
        }

        // Remove any conversational prefixes before the actual structured content
        // This strips introductory text like "Here are the structured issues..." or "feat(area): Okay, here are..."
        text = text.replace(/^.*?(ISSUE\s*1\s*:|TITLE:)/i, "$1");

        const issues = [];

        // Split the text by issue markers - improved regex to better match issue headers
        const issueBlocks = text.split(/ISSUE\s*\d+\s*:/i).filter(block => block.trim().length > 0);

        // If no issue blocks found, check for alternative format or treat the entire text as one issue
        if (issueBlocks.length === 0) {
            // Try to find any structured content
            if (text.includes("TITLE:") || text.includes("Title:")) {
                const parsedIssue = this.parseStructuredResponse(text);

                // Apply title format if provided
                if (titleFormat && parsedIssue.title !== "AI-Generated Issue") {
                    parsedIssue.title = this.formatTitleIfNeeded(parsedIssue.title, titleFormat);
                }

                return [parsedIssue];
            }

            // If there's no structured content, return a more specific error
            return [{
                title: "AI Response Format Error",
                description: "The AI response wasn't in the expected format. Please try again with different content.",
                priority: 2,
                tags: ["error", "format-issue"],
            }];
        }

        // Process each issue block with improved handling
        for (const block of issueBlocks) {
            const parsedIssue = this.parseStructuredResponse(block);

            // Only add valid issues (with titles that aren't the fallback)
            if (parsedIssue.title !== "AI-Generated Issue") {
                // Apply title format if provided
                if (titleFormat) {
                    parsedIssue.title = this.formatTitleIfNeeded(parsedIssue.title, titleFormat);
                }

                issues.push(parsedIssue);
            } else if (block.trim().length > 30) {
                // If we got a fallback title but the block has substantial content,
                // try to generate a title from the content
                const lines = block.trim().split('\n').filter(line => line.trim().length > 0);
                if (lines.length > 0) {
                    const autoTitle = lines[0].substring(0, 50) + (lines[0].length > 50 ? "..." : "");
                    parsedIssue.title = titleFormat
                        ? this.formatTitleIfNeeded(autoTitle, titleFormat)
                        : autoTitle;
                    issues.push(parsedIssue);
                }
            }
        }

        // If we couldn't parse any valid issues but have content, return a more helpful issue
        if (issues.length === 0 && text.trim().length > 0) {
            const title = titleFormat
                ? this.formatTitleIfNeeded("Content Analysis", titleFormat)
                : "Content Analysis";

            return [{
                title: title,
                description: text.trim(),
                priority: 2,
                tags: ["needs-review"],
            }];
        }

        return issues;
    }

    // Helper method to apply title format if the title doesn't already follow it
    private formatTitleIfNeeded(title: string, format: string): string {
        if (this.titleFollowsFormat(title, format)) {
            return title;
        }
        return this.applyTitleFormat(title, format);
    }

    // For parsing text responses from image analysis
    private parseStructuredResponse(text: string) {
        console.log("Parsing response:", text);

        // More flexible regex patterns to match the fields with case insensitivity
        const titlePattern = /(?:TITLE|Title):\s*(.*?)(?:\n|$)/i;
        const descPattern = /(?:DESCRIPTION|Description):\s*([\s\S]*?)(?:(?:PRIORITY|Priority):|$)/i;
        const prioPattern = /(?:PRIORITY|Priority):\s*(.*?)(?:\n|$)/i;
        const tagsPattern = /(?:TAGS|Tags):\s*(.*?)(?:\n|$)/i;

        const titleMatch = text.match(titlePattern);
        const descMatch = text.match(descPattern);
        const prioMatch = text.match(prioPattern);
        const tagsMatch = text.match(tagsPattern);

        // Extract title with better fallback
        let title = "AI-Generated Issue";
        if (titleMatch && titleMatch[1] && titleMatch[1].trim()) {
            title = titleMatch[1].trim();
        } else {
            // Try to extract a title from the first non-empty line if no title is found
            const firstLine = text.split('\n').find(line => line.trim().length > 0);
            if (firstLine && firstLine.length > 5 && !firstLine.includes(":")) {
                title = firstLine.trim().substring(0, 50) + (firstLine.length > 50 ? "..." : "");
            }
        }

        // Extract description with better fallback
        let description = "No description provided by AI";
        if (descMatch && descMatch[1] && descMatch[1].trim()) {
            description = descMatch[1].trim();
        } else {
            // If no explicit description section, use the content after removing other sections
            const contentWithoutSections = text
                .replace(/(?:TITLE|Title):\s*.*?(?:\n|$)/i, '')
                .replace(/(?:PRIORITY|Priority):\s*.*?(?:\n|$)/i, '')
                .replace(/(?:TAGS|Tags):\s*.*?(?:\n|$)/i, '')
                .trim();

            if (contentWithoutSections.length > 0) {
                description = contentWithoutSections;
            }
        }

        // Extract priority
        let priorityValue = 2; // Default to medium
        if (prioMatch && prioMatch[1]) {
            const priorityText = prioMatch[1].trim().toUpperCase();
            if (priorityText.includes("P0") || priorityText.includes("CRITICAL") || priorityText.includes("HIGHEST") || priorityText.includes("URGENT")) {
                priorityValue = 0;
            } else if (priorityText.includes("P1") || priorityText.includes("HIGH")) {
                priorityValue = 1;
            } else if (priorityText.includes("P3") || priorityText.includes("LOW")) {
                priorityValue = 3;
            }
        }

        // Extract tags
        let tags: string[] = [];
        if (tagsMatch && tagsMatch[1]) {
            tags = tagsMatch[1].split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }

        const result = {
            title: title,
            description: description,
            priority: priorityValue,
            tags: tags.length > 0 ? tags : ["needs-triage"],
        };

        console.log("Parsed result:", result);
        return result;
    }
} 