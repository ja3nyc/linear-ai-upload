import { authOptions } from "@/lib/auth";
import { GoogleAIService } from "@/services/google-ai-service";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.accessToken) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const teamId = formData.get("teamId") as string;
        const fileType = formData.get("fileType") as string;
        const file = formData.get("file") as File;
        const text = formData.get("text") as string;
        const titleFormat = formData.get("titleFormat") as string || "";

        if (!teamId) {
            return NextResponse.json(
                { error: "Team ID is required" },
                { status: 400 }
            );
        }

        // Initialize Google AI service
        const googleAIKey = process.env.GOOGLE_API_KEY;
        if (!googleAIKey) {
            return NextResponse.json(
                { error: "Google AI API key is not configured" },
                { status: 500 }
            );
        }
        const googleAIService = new GoogleAIService(googleAIKey);

        let analysis;

        // Process content based on type
        if (file) {
            if (fileType === 'image') {
                // For image analysis
                const fileBuffer = await file.arrayBuffer();
                const fileBase64 = Buffer.from(fileBuffer).toString("base64");
                const dataUrl = `data:${file.type};base64,${fileBase64}`;
                analysis = await googleAIService.analyzeImage(dataUrl, titleFormat);
            } else if (fileType === 'pdf') {
                // For PDF analysis - handle as text extraction from PDF
                const fileBuffer = await file.arrayBuffer();
                const fileBase64 = Buffer.from(fileBuffer).toString("base64");
                const dataUrl = `data:${file.type};base64,${fileBase64}`;
                
                // Use specific PDF analysis method that handles text extraction
                analysis = await googleAIService.analyzePDF(dataUrl, titleFormat);
            } else {
                return NextResponse.json(
                    { error: "Unsupported file type" },
                    { status: 400 }
                );
            }
        } else if (text) {
            // For text analysis
            analysis = await googleAIService.analyzeText(text, titleFormat);
        } else {
            return NextResponse.json(
                { error: "No valid content provided" },
                { status: 400 }
            );
        }

        // Check if any issues were found
        if (!analysis || analysis.length === 0) {
            return NextResponse.json({
                analysis: [],
                message: "No issues were identified in the content. Try with different content or add more details."
            });
        }

        return NextResponse.json({
            analysis,
            message: analysis.length > 1
                ? `${analysis.length} issues found. The AI has identified multiple issues in your content.`
                : "Analysis complete."
        });
    } catch (error) {
        console.error("Error analyzing content:", error);
        return NextResponse.json(
            { error: (error as Error).message || "Failed to process request" },
            { status: 500 }
        );
    }
} 