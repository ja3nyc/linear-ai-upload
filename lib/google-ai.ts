import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export interface ImageAnalysisResult {
    title: string;
    description: string;
    priority?: string;
    tags?: string[];
}

export class GoogleAIService {
    /**
     * Analyze an image and generate issue information
     * @param imageBase64 - Base64 encoded image data
     * @returns Issue information generated from the image
     */
    async analyzeImage(imageBase64: string): Promise<ImageAnalysisResult> {
        try {
            // Remove the data URL prefix if present
            const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

            // Generate issue information from the image using Google AI
            const { text } = await generateText({
                model: google("gemini-1.5-pro-latest"),
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `You are an expert at analyzing images and creating Linear issues from them. 
                Please analyze this image and provide:
                1. A concise title for a Linear issue (max 80 chars)
                2. A detailed description of what you see in the image that would be helpful for a developer
                3. Suggest a priority level (Low, Medium, High, Urgent) based on what you see
                4. Suggest 1-3 relevant tags

                Format your response as a JSON object with fields: title, description, priority, tags.
                Don't include explanations outside the JSON structure.`,
                            },
                            {
                                type: "file",
                                data: Buffer.from(base64Data, "base64"),
                                mimeType: "image/png",
                            },
                        ],
                    },
                ],
            });

            // Parse the JSON response
            const resultText = text.trim();
            const jsonMatch = resultText.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                throw new Error("Failed to parse JSON response from Google AI");
            }

            const result = JSON.parse(jsonMatch[0]) as ImageAnalysisResult;

            return {
                title: result.title || "Untitled Issue",
                description: result.description || "No description provided",
                priority: result.priority || "Medium",
                tags: result.tags || [],
            };
        } catch (error) {
            console.error("Error analyzing image:", error);
            throw new Error(`Failed to analyze image: ${(error as Error).message}`);
        }
    }
} 