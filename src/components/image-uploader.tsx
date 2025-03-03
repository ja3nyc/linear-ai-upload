"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, FileText, Layers, Loader2, PaperclipIcon, Plus, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { ChangeEvent, ClipboardEvent, DragEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

interface Team {
    id: string;
    name: string;
    key: string;
}

interface Project {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
}

interface Label {
    id: string;
    name: string;
    color: string;
}

interface WorkflowState {
    id: string;
    name: string;
    color: string;
    type: string;
}

interface AnalysisResult {
    title: string;
    description: string;
    priority: string | number;
    tags: string[];
}

interface IssueResult {
    id: string;
    title: string;
    url: string;
}

interface ContentData {
    type: 'image' | 'pdf' | 'text';
    file?: File;
    text?: string;
    previewUrl?: string;
}

// Add this helper component near the top of the component
const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-1">
        {children}
        <span className="text-red-500">*</span>
    </div>
);

export default function ImageUploader() {
    const { data: session } = useSession();
    const [content, setContent] = useState<ContentData | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isCreatingIssue, setIsCreatingIssue] = useState(false);
    const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
    const [currentIssueIndex, setCurrentIssueIndex] = useState(0);
    const [issueResults, setIssueResults] = useState<IssueResult[]>([]);
    const [editedIssues, setEditedIssues] = useState<AnalysisResult[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [labels, setLabels] = useState<Label[]>([]);
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [states, setStates] = useState<WorkflowState[]>([]);
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [titleFormat, setTitleFormat] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isLoadingLabels, setIsLoadingLabels] = useState(false);
    const [isLoadingStates, setIsLoadingStates] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [activeTab, setActiveTab] = useState<string>("upload");
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const [isDragActive, setIsDragActive] = useState(false);

    // Add new interface for organizing team data
    interface TeamData {
        teamId: string;
        projects: Project[];
        labels: Label[];
        states: WorkflowState[];
        isLoaded: boolean;
    }

    // Add additional state for all teams data
    const [allTeamsData, setAllTeamsData] = useState<Record<string, TeamData>>({});
    const [isLoadingTeamData, setIsLoadingTeamData] = useState(false);

    // Single useEffect to handle all fetching using the consolidated API
    useEffect(() => {
        if (!session?.accessToken) return;

        const fetchAllData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Make a single API call to fetch all data
                const response = await fetch("/api/all-data");

                if (!response.ok) {
                    throw new Error(`Error fetching data: ${response.status}`);
                }

                const data = await response.json();

                // Update all state values from the single response
                setTeams(data.teams || []);
                setUsers(data.users || []);

                // Process team-specific data
                const teamsDataRecord: Record<string, TeamData> = {};

                // Convert array to record for easier lookup
                if (data.teamsData && Array.isArray(data.teamsData)) {
                    data.teamsData.forEach((teamData: any) => {
                        teamsDataRecord[teamData.teamId] = {
                            teamId: teamData.teamId,
                            projects: teamData.projects || [],
                            labels: teamData.labels || [],
                            states: teamData.states || [],
                            isLoaded: true
                        };
                    });
                }

                setAllTeamsData(teamsDataRecord);

                console.log("All data loaded in a single request");
            } catch (error) {
                console.error("Error fetching all data:", error);
                toast.error(`Error: ${(error as Error).message}`);
                setError("Failed to fetch data. Please check your Linear connection.");
            } finally {
                setIsLoading(false);
                setIsLoadingTeamData(false);
            }
        };

        fetchAllData();
    }, [session]);

    // Update local state when selectedTeam changes
    useEffect(() => {
        if (!selectedTeam || !allTeamsData[selectedTeam]) {
            setProjects([]);
            setLabels([]);
            setStates([]);
            setSelectedProject(null);
            return;
        }

        const teamData = allTeamsData[selectedTeam];

        // Only update states if the team data has been loaded
        if (teamData.isLoaded) {
            setProjects(teamData.projects);
            setLabels(teamData.labels);
            setStates(teamData.states);
        }
    }, [selectedTeam, allTeamsData]);

    // Add a new function to handle initial setup of editable issues after analysis
    useEffect(() => {
        if (analysisResults.length > 0) {
            setEditedIssues([...analysisResults]);
        }
    }, [analysisResults]);

    // Handle title change for current issue
    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newIssues = [...editedIssues];
        newIssues[currentIssueIndex] = {
            ...newIssues[currentIssueIndex],
            title: e.target.value
        };
        setEditedIssues(newIssues);
    };

    // Handle description change for current issue
    const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const newIssues = [...editedIssues];
        newIssues[currentIssueIndex] = {
            ...newIssues[currentIssueIndex],
            description: e.target.value
        };
        setEditedIssues(newIssues);
    };

    // Handle priority change for current issue
    const handlePriorityChange = (value: string) => {
        const newIssues = [...editedIssues];
        newIssues[currentIssueIndex] = {
            ...newIssues[currentIssueIndex],
            priority: parseInt(value)
        };
        setEditedIssues(newIssues);
    };

    // Handle tags change for current issue
    const handleTagsChange = (e: ChangeEvent<HTMLInputElement>) => {
        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const newIssues = [...editedIssues];
        newIssues[currentIssueIndex] = {
            ...newIssues[currentIssueIndex],
            tags: tags
        };
        setEditedIssues(newIssues);
    };

    // Generate a Linear issue URL for preview
    const getLinearNewIssueUrl = () => {
        if (analysisResults.length === 0 || !selectedTeam) return null;

        const team = teams.find(t => t.id === selectedTeam);
        if (!team) return null;

        // Map numeric priority to Linear's expected format
        let priorityString = "Medium"; // Default to Medium
        const priorityValue = typeof analysisResults[currentIssueIndex].priority === 'string'
            ? parseInt(analysisResults[currentIssueIndex].priority)
            : analysisResults[currentIssueIndex].priority;

        switch (priorityValue) {
            case 0:
                priorityString = "Urgent";
                break;
            case 1:
                priorityString = "High";
                break;
            case 2:
                priorityString = "Medium";
                break;
            case 3:
                priorityString = "Low";
                break;
        }

        const params = new URLSearchParams({
            title: analysisResults[currentIssueIndex].title,
            description: analysisResults[currentIssueIndex].description,
            priority: priorityString,
        });

        // Add selected project if available
        if (selectedProject) {
            const project = projects.find(p => p.id === selectedProject);
            if (project) {
                // Linear URL typically expects project ID in a specific format
                // This may need adjustment based on Linear's URL structure
                params.append("projectId", selectedProject);
            }
        }

        // Add tags if available
        if (analysisResults[currentIssueIndex].tags && analysisResults[currentIssueIndex].tags.length > 0) {
            params.append("labels", analysisResults[currentIssueIndex].tags.join(","));
        }

        return `https://linear.app/${team.key}/issue/new?${params.toString()}`;
    };

    // Handle team selection
    const handleTeamChange = (teamId: string) => {
        setSelectedTeam(teamId);
        setSelectedProject(null);
        setSelectedUser(null);
        setSelectedLabels([]);
        setSelectedState(null);
    };

    // Handle file selection
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            handleFileSelected(file);
        }
    };

    // Handle file selected (from input, drag & drop, or paste)
    const handleFileSelected = (file: File) => {
        setAnalysisResults([]);
        setIssueResults([]);
        setCurrentIssueIndex(0);

        // Determine content type
        const fileType = file.type;
        let contentType: 'image' | 'pdf' | 'text';

        if (fileType.startsWith("image/")) {
            contentType = 'image';
        } else if (fileType === "application/pdf") {
            contentType = 'pdf';
        } else {
            toast.error("Unsupported file type. Please upload an image or PDF.");
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
            setContent({
                type: contentType,
                file: file,
                previewUrl: reader.result as string
            });

            // Show a toast message for PDF uploads with helpful information
            if (contentType === 'pdf') {
                toast.info("PDF uploaded. AI will analyze the text content of the PDF.");
            }
        };
        reader.readAsDataURL(file);
    };

    // Handle text input
    const handleTextInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        if (text.trim()) {
            setContent({
                type: 'text',
                text: text
            });
        } else {
            setContent(null);
        }

        setAnalysisResults([]);
        setIssueResults([]);
    };

    // Handle drag and drop
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    };

    // Add new handleDragLeave function
    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelected(e.dataTransfer.files[0]);
        }
    };

    // Handle paste
    const handlePaste = (e: ClipboardEvent<HTMLDivElement | HTMLTextAreaElement>) => {
        // For files (images)
        const items = e.clipboardData.items;
        let foundImage = false;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                const file = items[i].getAsFile();
                if (file) {
                    handleFileSelected(file);
                    foundImage = true;

                    // If we're in the text area, prevent the default behavior
                    // to avoid pasting the image as text
                    if (activeTab === 'text') {
                        e.preventDefault();
                    }

                    // Switch to the upload tab if we found an image
                    setActiveTab('upload');
                    break;
                }
            }
        }

        // For text (only if we didn't find an image)
        if (!foundImage && activeTab === 'upload') {
            const text = e.clipboardData.getData('text');
            if (text) {
                setActiveTab('text');
                setContent({
                    type: 'text',
                    text: text
                });

                // Update the textarea value (needs a slight delay)
                setTimeout(() => {
                    if (textAreaRef.current) {
                        textAreaRef.current.value = text;
                    }
                }, 100);

                setAnalysisResults([]);
                setIssueResults([]);
            }
        }
    };

    // Add a handler for title format changes
    const handleTitleFormatChange = (e: ChangeEvent<HTMLInputElement>) => {
        setTitleFormat(e.target.value);
    };

    // Handle analyze
    const handleAnalyze = async () => {
        if (!content) {
            toast.error("Please provide content to analyze");
            return;
        }

        if (!selectedTeam) {
            toast.error("Please select a team");
            return;
        }

        setIsAnalyzing(true);
        setAnalysisResults([]);
        setIssueResults([]);
        setCurrentIssueIndex(0);

        try {
            const formData = new FormData();
            formData.append("teamId", selectedTeam);
            formData.append("titleFormat", titleFormat);

            if (content.type === 'image' || content.type === 'pdf') {
                if (!content.file) {
                    throw new Error("File is missing");
                }
                formData.append("file", content.file);
                formData.append("fileType", content.type);
            } else if (content.type === 'text') {
                if (!content.text) {
                    throw new Error("Text content is missing");
                }
                formData.append("text", content.text);
            }

            const response = await fetch("/api/analyze-content", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to analyze content");
            }

            const data = await response.json();
            setAnalysisResults(data.analysis);

            if (data.analysis.length > 0) {
                toast.success(`${data.analysis.length} issue(s) identified!`);
            } else {
                toast.warning("No issues were identified. Please try again.");
            }
        } catch (error) {
            console.error("Error analyzing content:", error);
            toast.error(`Failed to analyze: ${(error as Error).message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Create issue in Linear using the edited issue data
    const handleCreateIssue = async () => {
        if (!selectedTeam || editedIssues.length === 0) {
            setError('Please select a team and analyze content first.');
            return;
        }

        setIsCreatingIssue(true);
        setError(null);

        const currentAnalysis = editedIssues[currentIssueIndex];

        try {
            const response = await fetch('/api/create-issue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teamId: selectedTeam,
                    title: currentAnalysis.title,
                    description: currentAnalysis.description,
                    priority: parseInt(currentAnalysis.priority.toString()),
                    tags: currentAnalysis.tags,
                    projectId: selectedProject || undefined,
                    assigneeId: selectedUser || undefined,
                    labelIds: selectedLabels.length > 0 ? selectedLabels : undefined,
                    stateId: selectedState || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create issue');
            }

            const data = await response.json();

            // Add the new issue to our results array
            const newIssueResults = [...issueResults];
            newIssueResults[currentIssueIndex] = data.issue;
            setIssueResults(newIssueResults);

            toast.success('Issue created successfully!');
        } catch (error) {
            console.error('Error creating issue:', error);
            setError(`Failed to create issue: ${(error as Error).message}`);
        } finally {
            setIsCreatingIssue(false);
        }
    };

    const handleNextIssue = () => {
        if (currentIssueIndex < analysisResults.length - 1) {
            setCurrentIssueIndex(currentIssueIndex + 1);
        }
    };

    const handlePrevIssue = () => {
        if (currentIssueIndex > 0) {
            setCurrentIssueIndex(currentIssueIndex - 1);
        }
    };

    // Get the current analysis result (use editedIssues instead of analysisResults)
    const currentAnalysis = editedIssues.length > 0 ? editedIssues[currentIssueIndex] : null;
    const currentIssueResult = issueResults[currentIssueIndex] || null;

    // Clear selected content and reset state
    const handleClear = () => {
        setContent(null);
        setAnalysisResults([]);
        setEditedIssues([]);
        setIssueResults([]);
        setCurrentIssueIndex(0);
        setIsEditing(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        if (textAreaRef.current) {
            textAreaRef.current.value = "";
        }
        setError(null);
        setIsDragActive(false);
        setIsAnalyzing(false);
        setIsCreatingIssue(false);
    };

    const handleLabelChange = (labelId: string) => {
        setSelectedLabels(prev => {
            if (prev.includes(labelId)) {
                return prev.filter(id => id !== labelId);
            } else {
                return [...prev, labelId];
            }
        });
    };

    // Add a helper function to check if text contains Markdown
    const containsMarkdown = (text: string): boolean => {
        // Check for common Markdown syntax
        const markdownPatterns = [
            /^#{1,6}\s+/m,         // Headers
            /\*\*(.+?)\*\*/,       // Bold
            /\*(.+?)\*/,           // Italic
            /\[.+?\]\(.+?\)/,      // Links
            /^>\s+.+/m,            // Blockquotes
            /^-\s+.+/m,            // Unordered lists
            /^[0-9]+\.\s+.+/m,     // Ordered lists
            /`(.+?)`/,             // Inline code
            /^```[\s\S]*?```$/m,   // Code blocks
            /!\[.+?\]\(.+?\)/,     // Images
            /^---/m,               // Horizontal rules
            /\|(.+?\|)+/m          // Tables
        ];

        return markdownPatterns.some(pattern => pattern.test(text));
    };

    // Add a function to insert Markdown elements at the cursor position
    const insertMarkdown = (template: string) => {
        const textarea = document.getElementById('description') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = currentAnalysis?.description || '';
        const selectedText = text.substring(start, end);

        let insertion = template;
        if (template.includes('$1')) {
            insertion = template.replace('$1', selectedText);
        }

        const newText = text.substring(0, start) + insertion + text.substring(end);

        const newIssues = [...editedIssues];
        newIssues[currentIssueIndex] = {
            ...newIssues[currentIssueIndex],
            description: newText
        };
        setEditedIssues(newIssues);

        // Focus and set cursor position after update
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + insertion.length - (template.includes('$1') ? 0 : 2);
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    return (
        <div className="space-y-6">
            <div className="w-full max-w-4xl">
                <Card className="neo-card bg-main shadow-none overflow-visible">
                    <CardHeader className="border-none">
                        <CardTitle className="text-2xl flex items-center gap-3">
                            <Image
                                src="/logo-dark.svg"
                                alt="Linear Logo"
                                width={28}
                                height={28}
                            />
                            Create Linear Issue
                        </CardTitle>
                        <CardDescription>
                            Upload images/PDFs, paste text or paste screenshots to create Linear issues
                        </CardDescription>
                        <p className="text-sm text-gray-500 mt-1">Fields marked with <span className="text-red-500">*</span> are required</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Team Selection */}
                        <div className="space-y-2">
                            <div className="space-y-2 relative">
                                <Label htmlFor="team" className="font-bold text-base">
                                    <RequiredLabel>Select Team</RequiredLabel>
                                </Label>
                                <Select
                                    value={selectedTeam || ''}
                                    onValueChange={handleTeamChange}
                                    disabled={isLoading || teams.length === 0}
                                >
                                    <SelectTrigger className="neo-button w-full justify-between bg-white px-3 py-2">
                                        <SelectValue placeholder="Select a team" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teams.map((team) => (
                                            <SelectItem key={team.id} value={team.id}>
                                                {team.name} ({team.key})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {isLoading && (
                                <div className="flex items-center mt-1 text-sm text-gray-500">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading teams...
                                </div>
                            )}
                        </div>

                        {/* Project Selection - Only show when team is selected */}
                        {selectedTeam && (
                            <div className="space-y-2">
                                <div className="space-y-2 relative">
                                    <Label htmlFor="project" className="font-bold text-base">Select Project</Label>
                                    <Select
                                        value={selectedProject || ''}
                                        onValueChange={setSelectedProject}
                                        disabled={isLoadingProjects}
                                    >
                                        <SelectTrigger className="neo-button w-full justify-between bg-white px-3 py-2">
                                            <SelectValue placeholder={
                                                isLoadingProjects
                                                    ? "Loading projects..."
                                                    : projects.length === 0
                                                        ? "No projects available"
                                                        : "Select a project (optional)"
                                            } />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects.length > 0 ? (
                                                projects.map((project) => (
                                                    <SelectItem key={project.id} value={project.id}>
                                                        {project.name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="no-projects" disabled>
                                                    {isLoadingProjects ? "Loading..." : "No projects available"}
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {isLoadingProjects && (
                                    <div className="flex items-center mt-1 text-sm text-gray-500">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading projects...
                                    </div>
                                )}
                            </div>
                        )}

                        {/* User, Status, and Labels */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* Assignee Selection */}
                            <div className="space-y-2 relative">
                                <Label htmlFor="assignee" className="font-bold text-base">Assign To</Label>
                                <Select
                                    value={selectedUser || ''}
                                    onValueChange={setSelectedUser}
                                    disabled={isLoadingUsers}
                                >
                                    <SelectTrigger className="neo-button w-full justify-between bg-white px-3 py-2">
                                        <SelectValue placeholder={
                                            isLoadingUsers
                                                ? "Loading users..."
                                                : users.length === 0
                                                    ? "No users available"
                                                    : "Select an assignee (optional)"
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {isLoadingUsers && (
                                    <div className="flex items-center mt-1 text-sm text-gray-500">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading users...
                                    </div>
                                )}
                            </div>

                            {/* Status Selection */}
                            <div className="space-y-2 relative">
                                <Label htmlFor="state" className="font-bold text-base">
                                    <RequiredLabel>Status</RequiredLabel>
                                </Label>
                                <Select
                                    value={selectedState || ''}
                                    onValueChange={setSelectedState}
                                    disabled={!selectedTeam || isLoadingStates}
                                >
                                    <SelectTrigger className="neo-button w-full justify-between bg-white px-3 py-2">
                                        <SelectValue placeholder={
                                            isLoadingStates
                                                ? "Loading states..."
                                                : states.length === 0
                                                    ? "No states available"
                                                    : "Select a state"
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {states.map((state) => (
                                            <SelectItem key={state.id} value={state.id}>
                                                {state.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {isLoadingStates && (
                                    <div className="flex items-center mt-1 text-sm text-gray-500">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading states...
                                    </div>
                                )}
                            </div>

                            {/* Labels Dropdown */}
                            <div className="space-y-2 relative">
                                <Label className="font-bold text-base">Labels</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            role="combobox"
                                            className="neo-button w-full justify-between bg-white px-3 py-2"
                                            disabled={!selectedTeam || isLoadingLabels}
                                        >
                                            {selectedLabels.length > 0
                                                ? `${selectedLabels.length} label(s) selected`
                                                : "Select labels"}
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search labels..." />
                                            <CommandList>
                                                <CommandEmpty>No labels found.</CommandEmpty>
                                                <CommandGroup className="max-h-60 overflow-auto">
                                                    {labels.map((label) => (
                                                        <CommandItem
                                                            key={label.id}
                                                            onSelect={() => handleLabelChange(label.id)}
                                                            className="flex items-center space-x-2"
                                                        >
                                                            <Checkbox
                                                                checked={selectedLabels.includes(label.id)}
                                                                onCheckedChange={() => handleLabelChange(label.id)}
                                                                className="mr-2"
                                                            />
                                                            <div
                                                                className="w-3 h-3 rounded-full mr-2"
                                                                style={{ backgroundColor: label.color }}
                                                            />
                                                            <span>{label.name}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {isLoadingLabels && (
                                    <div className="flex items-center mt-1 text-sm text-gray-500">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading labels...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Title Format */}
                        <div className="space-y-2">
                            <Label htmlFor="titleFormat" className="font-bold text-base">Title Format (Optional)</Label>
                            <Input
                                id="titleFormat"
                                value={titleFormat}
                                onChange={handleTitleFormatChange}
                                placeholder="e.g., feat(area): Title or bug(component): Description"
                                className="neo-input w-full"
                            />
                            <div className="text-xs text-gray-500">
                                Define how you want your issue titles formatted. AI will follow this pattern. Examples:
                                <div className="font-mono mt-1">feat(UI): Title or bug(api): Description</div>
                            </div>
                        </div>

                        {/* Content Input Tabs */}
                        <Tabs defaultValue="upload" className="w-full mt-2" onValueChange={setActiveTab}>
                            <div className="flex items-center mb-1">
                                <Label className="font-bold text-base">
                                    <RequiredLabel>Content</RequiredLabel>
                                </Label>
                            </div>
                            <TabsList className="grid w-full grid-cols-2 border-2 border-black p-1">
                                <TabsTrigger value="upload">Upload/Paste Image</TabsTrigger>
                                <TabsTrigger value="text">Enter Text</TabsTrigger>
                            </TabsList>

                            {/* Upload Tab */}
                            <TabsContent value="upload" className="space-y-4">
                                <div
                                    className={`mt-4 neo-border-dashed rounded-md bg-white p-6 text-center ${isDragActive ? 'bg-amber-50' : ''} transition-all`}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onPaste={handlePaste}
                                    ref={dropZoneRef}
                                >
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*,application/pdf"
                                    />
                                    {!content?.previewUrl ? (
                                        <div className="text-center space-y-2">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                                                <PaperclipIcon className="mx-auto h-8 w-8 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">
                                                    Click to upload, drag and drop, or paste
                                                </p>
                                                <p className="mt-1 text-xs font-medium">
                                                    Upload images or PDFs up to 10MB
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative w-full max-h-[200px] rounded-lg overflow-hidden bg-gray-100">
                                            {content.type === 'image' ? (
                                                <div className="h-[180px] relative">
                                                    <Image
                                                        src={content.previewUrl}
                                                        alt="Preview"
                                                        fill
                                                        style={{ objectFit: "contain" }}
                                                    />
                                                </div>
                                            ) : content.type === 'pdf' ? (
                                                <div className="flex items-center justify-center h-[100px]">
                                                    <FileText className="w-12 h-12 text-gray-400" />
                                                    <p className="ml-2 text-gray-700 text-sm">{content.file?.name}</p>
                                                </div>
                                            ) : null}
                                            <Button
                                                variant="neutral"
                                                size="sm"
                                                className="neo-button absolute top-2 right-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleClear();
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Text Tab */}
                            <TabsContent value="text" className="space-y-4">
                                <div
                                    className="relative"
                                    onPaste={(e) => {
                                        // Check if this is an image paste
                                        const items = e.clipboardData.items;
                                        for (let i = 0; i < items.length; i++) {
                                            if (items[i].type.startsWith('image/')) {
                                                handlePaste(e);
                                                return;
                                            }
                                        }
                                        // Otherwise, let the textarea handle it naturally
                                    }}
                                >
                                    <Textarea
                                        ref={textAreaRef}
                                        placeholder="Enter or paste text describing the issue... You can also paste images here!"
                                        className="neo-input min-h-[200px] w-full"
                                        onChange={handleTextInput}
                                    />
                                    <div className="text-xs text-gray-500 mt-1">
                                        Tip: You can also paste images directly into this text box (Ctrl+V)
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Preview Option */}
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="preview-mode"
                                checked={true}
                                onCheckedChange={(value) => {
                                    // Preview mode is always enabled
                                }}
                            />
                            <Label htmlFor="preview-mode">Preview before creating issue</Label>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 flex justify-center">
                            <Button
                                onClick={handleAnalyze}
                                disabled={!content || !selectedTeam || isAnalyzing}
                                className="neo-button bg-main border-black text-black"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Layers className="mr-2 h-4 w-4" />
                                        Analyze Content for Issue(s)
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analysis Results */}
            {analysisResults.length > 0 && (
                <div className="mb-6">
                    {analysisResults.length > 1 && (
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                variant="noShadow"
                                onClick={handlePrevIssue}
                                disabled={currentIssueIndex === 0}
                                className="neo-button bg-gray-200 border-black text-black"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous Issue
                            </Button>
                            <div className="text-center font-medium">
                                Issue {currentIssueIndex + 1} of {analysisResults.length}
                            </div>
                            <Button
                                variant="noShadow"
                                onClick={handleNextIssue}
                                disabled={currentIssueIndex === analysisResults.length - 1}
                                className="neo-button bg-gray-200 border-black text-black"
                            >
                                Next Issue
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    )}
                    <div className="relative">
                        <div
                            key={currentIssueIndex}
                            className="transition-all duration-300 ease-in-out"
                            style={{
                                opacity: 1,
                                transform: `translateX(0)`
                            }}
                        >
                            <Card className="neo-card bg-white border-black shadow-none overflow-visible">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle>AI Analysis</CardTitle>
                                            <CardDescription>Review and edit the issue details before creating it in Linear</CardDescription>
                                        </div>
                                        <Button
                                            className="neo-button bg-gray-200 border-black text-black"
                                            onClick={() => setIsEditing(!isEditing)}
                                        >
                                            {isEditing ? "Preview Mode" : "Edit Mode"}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {!isEditing ? (
                                        // Preview mode - display formatted content
                                        <>
                                            <div className="space-y-1">
                                                <h3 className="font-medium">Title</h3>
                                                <p className="text-lg font-semibold">{currentAnalysis?.title}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium">Description</h3>
                                                    {currentAnalysis?.description && containsMarkdown(currentAnalysis.description) && (
                                                        <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-sm">
                                                            Markdown
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="markdown-content">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {currentAnalysis?.description || ''}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-medium">Priority</h3>
                                                <p>P{currentAnalysis?.priority}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-medium">Tags</h3>
                                                <div className="flex flex-wrap gap-1">
                                                    {currentAnalysis?.tags.map((tag, index) => (
                                                        <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        // Edit mode - editable form controls
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="title" className="font-medium">Title</Label>
                                                <Input
                                                    id="title"
                                                    value={currentAnalysis?.title || ''}
                                                    onChange={handleTitleChange}
                                                    className="neo-input w-full"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex flex-col gap-2">
                                                    <Label htmlFor="description" className="font-medium">Description</Label>
                                                    <div className="flex flex-wrap gap-1 mb-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => insertMarkdown('# $1')}
                                                            className="px-2 py-1 neo-button text-xs"
                                                            title="Heading"
                                                        >
                                                            Heading
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => insertMarkdown('**$1**')}
                                                            className="px-2 py-1 neo-button text-xs"
                                                            title="Bold"
                                                        >
                                                            Bold
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => insertMarkdown('*$1*')}
                                                            className="px-2 py-1 neo-button text-xs"
                                                            title="Italic"
                                                        >
                                                            Italic
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => insertMarkdown('- $1')}
                                                            className="px-2 py-1 neo-button text-xs"
                                                            title="List"
                                                        >
                                                            List
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => insertMarkdown('```\n$1\n```')}
                                                            className="px-2 py-1 neo-button text-xs"
                                                            title="Code Block"
                                                        >
                                                            Code
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => insertMarkdown('[Link Text](url)')}
                                                            className="px-2 py-1 neo-button text-xs"
                                                            title="Link"
                                                        >
                                                            Link
                                                        </button>
                                                    </div>
                                                </div>
                                                <Textarea
                                                    id="description"
                                                    value={currentAnalysis?.description || ''}
                                                    onChange={handleDescriptionChange}
                                                    className="neo-input min-h-[200px] w-full"
                                                />
                                                <p className="text-xs text-gray-500">
                                                    <span className="font-medium">Markdown supported:</span> Use # for headings, ** for bold, * for italic, ` for code, etc.
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="priority" className="font-medium">Priority</Label>
                                                <Select
                                                    value={currentAnalysis?.priority?.toString() || "2"}
                                                    onValueChange={handlePriorityChange}
                                                >
                                                    <SelectTrigger id="priority" className="neo-button w-full justify-between bg-white px-3 py-2">
                                                        <SelectValue placeholder="Select priority" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0">P0 - Urgent</SelectItem>
                                                        <SelectItem value="1">P1 - High</SelectItem>
                                                        <SelectItem value="2">P2 - Medium</SelectItem>
                                                        <SelectItem value="3">P3 - Low</SelectItem>
                                                        <SelectItem value="4">P4 - No Priority</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tags" className="font-medium">Tags</Label>
                                                <Input
                                                    id="tags"
                                                    value={currentAnalysis?.tags.join(", ") || ""}
                                                    onChange={handleTagsChange}
                                                    placeholder="Enter comma-separated tags"
                                                    className="w-full border-black"
                                                />
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                                <CardFooter className="border-t p-4">
                                    <Button
                                        className="neo-button bg-main border-black text-black"
                                        onClick={handleCreateIssue}
                                        disabled={isCreatingIssue}
                                    >
                                        {isCreatingIssue ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating Issue...
                                            </>
                                        ) : currentIssueResult ? (
                                            <>
                                                <Check className="mr-2 h-4 w-4" />
                                                Issue Created
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create Issue {currentIssueIndex + 1} of {analysisResults.length}
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            {/* Issue Results */}
            {issueResults.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold mb-4">Created Issues ({issueResults.filter(Boolean).length})</h2>
                    <div className="space-y-4">
                        <div className="grid gap-4">
                            {issueResults.filter(Boolean).map((issue, index) => (
                                <div
                                    key={issue.id}
                                    className="transition-all duration-300 ease-in-out"
                                    style={{
                                        opacity: 1,
                                        transform: 'translateY(0)'
                                    }}
                                >
                                    <Card className="neo-card bg-white border-black shadow-none overflow-visible">
                                        <CardHeader className="py-3">
                                            <CardTitle className="text-base">Issue {index + 1}: {issue.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="py-2">
                                            <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                                                <div className="flex items-center text-green-700">
                                                    <Check className="h-4 w-4 mr-2" />
                                                    <span>Created in Linear</span>
                                                </div>
                                                <a
                                                    href={issue.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#5E6AD2] hover:underline inline-flex items-center"
                                                >
                                                    View issue
                                                    <ExternalLink className="ml-1 h-3 w-3" />
                                                </a>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4">
                        <Button
                            variant="noShadow"
                            onClick={handleClear}
                            className="w-full"
                        >
                            Create More Issues
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
} 