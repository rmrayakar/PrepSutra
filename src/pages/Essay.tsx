import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getEssayFeedback,
  generateEssay,
  type GeneratedEssayResponse,
  type EssayFramework,
  type CompleteEssay,
  saveEssay,
  getUserEssays,
  getEssayById,
  updateEssay,
  deleteEssay,
  humanizeText,
} from "@/integrations/supabase/functions";
import { useToast } from "@/hooks/use-toast";
import type { EssayFeedbackResponse } from "@/integrations/supabase/functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Wand2 } from "lucide-react";
import { Loader2 } from "lucide-react";

const ESSAY_TYPES = [
  { value: "general", label: "General Essay" },
  { value: "philosophical", label: "Philosophical" },
  { value: "sociological", label: "Sociological" },
  { value: "economic", label: "Economic" },
  { value: "science_tech", label: "Science & Technology" },
  { value: "ethics", label: "Ethics & Integrity" },
  { value: "current_affairs", label: "Current Affairs" },
  { value: "governance", label: "Governance & Administration" },
  { value: "international", label: "International Relations" },
];

const WORD_LIMIT = 1200;

const Essay = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState<EssayFeedbackResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingEssay, setGeneratingEssay] = useState(false);
  const [essayTopic, setEssayTopic] = useState("");
  const [essayType, setEssayType] = useState("general");
  const [generatedEssay, setGeneratedEssay] = useState<CompleteEssay | null>(
    null
  );
  const [savedEssays, setSavedEssays] = useState<any[]>([]);
  const [currentEssayId, setCurrentEssayId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [framework, setFramework] = useState<EssayFramework | null>(null);
  const [generatingComplete, setGeneratingComplete] = useState(false);
  const { toast } = useToast();
  const [isHumanizing, setIsHumanizing] = useState(false);

  useEffect(() => {
    loadSavedEssays();
  }, []);

  const loadSavedEssays = async () => {
    try {
      const essays = await getUserEssays();
      setSavedEssays(essays);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load saved essays.",
        variant: "destructive",
      });
    }
  };

  const handleSaveDraft = async () => {
    if (!title || !content) {
      toast({
        title: "Error",
        description: "Please provide both title and content for your essay.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingDraft(true);
      let savedEssay;

      // Prepare feedback data
      const feedbackData = feedback ? JSON.stringify(feedback) : null;

      // Format content if it's not already formatted
      const formattedContent = content.includes("Examples:")
        ? content
        : content
            .split("\n")
            .map((paragraph) => paragraph.trim())
            .join("\n\n");

      if (currentEssayId) {
        savedEssay = await updateEssay(currentEssayId, {
          title,
          content: formattedContent,
          feedback: feedbackData,
          score: feedback?.overallScore || null,
        });
      } else {
        savedEssay = await saveEssay(
          title,
          formattedContent,
          feedbackData,
          feedback?.overallScore || null
        );
        setCurrentEssayId(savedEssay.id);
      }

      await loadSavedEssays();
      toast({
        title: "Success",
        description: "Essay saved successfully!",
      });
    } catch (error) {
      console.error("Error saving essay:", error);
      toast({
        title: "Error",
        description: "Failed to save essay. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const handleLoadEssay = async (id: string) => {
    try {
      const essay = await getEssayById(id);
      if (!essay) {
        throw new Error("Essay not found");
      }

      setTitle(essay.title || "");
      setContent(essay.content || "");
      setCurrentEssayId(essay.id);

      // Clear previous feedback
      setFeedback(null);

      // Parse feedback if it exists
      if (essay.feedback) {
        try {
          const parsedFeedback = JSON.parse(essay.feedback);
          // Validate the feedback structure
          if (parsedFeedback.parameters && parsedFeedback.overallScore) {
            setFeedback(parsedFeedback);
          }
        } catch (parseError) {
          console.error("Error parsing feedback:", parseError);
          // Don't throw error for feedback parsing issues
        }
      }

      toast({
        title: "Success",
        description: "Essay loaded successfully!",
      });
    } catch (error) {
      console.error("Error loading essay:", error);
      toast({
        title: "Error",
        description: "Failed to load essay. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEssay = async (id: string) => {
    if (!confirm("Are you sure you want to delete this essay?")) {
      return;
    }

    try {
      await deleteEssay(id);
      await loadSavedEssays();
      if (currentEssayId === id) {
        setTitle("");
        setContent("");
        setCurrentEssayId(null);
        setFeedback(null);
      }
      toast({
        title: "Success",
        description: "Essay deleted successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete essay. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGetFeedback = async () => {
    if (!title || !content) {
      toast({
        title: "Error",
        description: "Please provide both title and content for your essay.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // Format content if it's not already formatted
      const formattedContent = content.includes("Examples:")
        ? content
        : content
            .split("\n")
            .map((paragraph) => paragraph.trim())
            .join("\n\n");

      const response = await getEssayFeedback(title, formattedContent);
      setFeedback(response);
    } catch (error) {
      console.error("Error getting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to get essay feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFramework = async () => {
    if (!essayTopic) {
      toast({
        title: "Error",
        description: "Please enter an essay topic.",
        variant: "destructive",
      });
      return;
    }

    try {
      setGeneratingEssay(true);
      const response = await generateEssay(essayTopic, essayType, "framework");

      // Type guard to check if response is a framework
      if ("framework" in response) {
        setFramework(response);
      } else {
        throw new Error("Invalid framework response from server");
      }

      toast({
        title: "Success",
        description: "Essay framework generated successfully!",
      });
    } catch (error) {
      console.error("Framework generation error:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to generate essay framework. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingEssay(false);
    }
  };

  const handleGenerateComplete = async () => {
    if (!essayTopic) {
      toast({
        title: "Error",
        description: "Please enter an essay topic.",
        variant: "destructive",
      });
      return;
    }

    try {
      setGeneratingComplete(true);
      const response = await generateEssay(essayTopic, essayType, "complete");

      // Type guard to check if response is a complete essay
      if ("essay" in response) {
        const completeEssay = response as CompleteEssay;

        if (
          !completeEssay.essay.introduction ||
          !completeEssay.essay.body ||
          !completeEssay.essay.conclusion
        ) {
          throw new Error("Invalid essay structure received from the server");
        }

        setTitle(completeEssay.essay.title || essayTopic);

        // Format the essay content with proper spacing and structure
        const formattedContent = [
          completeEssay.essay.introduction,
          "",
          ...(completeEssay.essay.body || [])
            .map((section) => [
              `${section.heading || "Main Point"}`,
              section.content || "",
              "",
              "Examples:",
              ...(section.examples || []).map((ex) => `• ${ex}`),
              "",
            ])
            .flat(),
          "Conclusion:",
          completeEssay.essay.conclusion,
        ].join("\n");

        setContent(formattedContent);
        setCurrentEssayId(null);
        setFeedback(null);
        setFramework(null);

        toast({
          title: "Success",
          description: "Complete essay generated successfully!",
        });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Essay generation error:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to generate complete essay. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingComplete(false);
    }
  };

  const handleHumanize = async (content: string) => {
    if (!content) {
      toast({
        title: "Error",
        description: "Please enter some text to humanize",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsHumanizing(true);
      const humanizedText = await humanizeText(content);

      // Only update if we got a different text back
      if (humanizedText && humanizedText !== content) {
        setContent(humanizedText);
        toast({
          title: "Success",
          description: "Text has been humanized successfully",
        });
      } else {
        toast({
          title: "Info",
          description: "The text was already in a natural form",
        });
      }
    } catch (error) {
      console.error("Error humanizing text:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to humanize text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsHumanizing(false);
    }
  };

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const isOverWordLimit = wordCount > WORD_LIMIT;

  // Helper function to safely render essay sections
  const renderEssaySection = () => null;

  // Helper function to safely render examples and connections
  const renderExamplesAndConnections = () => null;

  // Helper function to safely render writing tips
  const renderWritingTips = () => null;

  // Helper function to render framework
  const renderFramework = () => {
    if (!framework?.framework) return null;

    return (
      <div className="space-y-6">
        <div className="border rounded-md p-4 bg-muted/30">
          <h3 className="font-medium mb-4">Suggested Structure</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">Introduction</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {framework.framework.suggestedStructure.introduction}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Body Paragraphs</h4>
              <ul className="mt-1 space-y-2">
                {framework.framework.suggestedStructure.bodyParagraphs.map(
                  (para, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {para}
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium">Conclusion</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {framework.framework.suggestedStructure.conclusion}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-2">Main Points</h3>
            <div className="space-y-4">
              {framework.framework.mainPoints.map((point, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="text-sm font-medium">{point.heading}</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {point.subPoints.map((subPoint, subIdx) => (
                      <li key={subIdx}>{subPoint}</li>
                    ))}
                  </ul>
                  {point.examples.length > 0 && (
                    <div className="pl-4">
                      <p className="text-sm font-medium">Examples:</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {point.examples.map((example, exIdx) => (
                          <li key={exIdx}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">UPSC Connections</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {framework.framework.connections.map((connection, idx) => (
                  <li key={idx}>{connection}</li>
                ))}
              </ul>
            </div>

            <div className="border rounded-md p-4 bg-green-50">
              <h3 className="font-medium mb-2 text-green-800">Writing Tips</h3>
              <ul className="list-disc list-inside text-sm text-green-700">
                {framework.framework.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Button
          onClick={handleGenerateComplete}
          disabled={generatingComplete}
          className="w-full"
        >
          {generatingComplete
            ? "Generating Complete Essay..."
            : "Generate Complete Essay"}
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Essay Builder & Feedback Tool
              </h2>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">View Saved Essays</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Saved Essays</DialogTitle>
                      <DialogDescription>
                        View and manage your saved essays
                      </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {savedEssays.map((essay) => (
                            <TableRow key={essay.id}>
                              <TableCell>{essay.title}</TableCell>
                              <TableCell>
                                {format(
                                  new Date(essay.updated_at),
                                  "MMM d, yyyy HH:mm"
                                )}
                              </TableCell>
                              <TableCell>
                                {essay.score
                                  ? `${essay.score}/100`
                                  : "No score"}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleLoadEssay(essay.id)}
                                    className="transition-all duration-200 hover:bg-prepsutra-primary hover:text-white hover:scale-105"
                                  >
                                    Load
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteEssay(essay.id)}
                                    className="transition-all duration-200 hover:bg-red-600 hover:scale-105"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  onClick={handleSaveDraft}
                  disabled={savingDraft || !title || !content}
                >
                  {savingDraft ? "Saving..." : "Save Draft"}
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground mt-2">
              Practice writing essays for UPSC with AI-powered feedback and
              suggestions.
            </p>

            <Card>
              <CardHeader>
                <CardTitle>Generate Essay Framework</CardTitle>
                <CardDescription>
                  Get an AI-generated framework to help structure your essay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="essayType">Essay Type</Label>
                  <Select value={essayType} onValueChange={setEssayType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select essay type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESSAY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="essayTopic">Essay Topic</Label>
                  <Input
                    id="essayTopic"
                    value={essayTopic}
                    onChange={(e) => setEssayTopic(e.target.value)}
                    placeholder="Enter your essay topic"
                  />
                </div>
                <Button
                  onClick={handleGenerateFramework}
                  disabled={generatingEssay}
                  className="w-full"
                >
                  {generatingEssay
                    ? "Generating Framework..."
                    : "Generate Framework"}
                </Button>
              </CardContent>
            </Card>

            {framework && (
              <Card>
                <CardHeader>
                  <CardTitle>Essay Framework</CardTitle>
                  <CardDescription>
                    Use this framework to structure your essay
                  </CardDescription>
                </CardHeader>
                <CardContent>{renderFramework()}</CardContent>
              </Card>
            )}

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Write Your Essay</CardTitle>
                  <CardDescription>
                    Write your essay and get AI-powered feedback
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Essay Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter your essay title"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Content</h3>
                      <div className="flex gap-2">
                        <div className="text-sm text-muted-foreground">
                          {wordCount}/{WORD_LIMIT} words
                          {isOverWordLimit && (
                            <span className="text-red-500 ml-2">
                              (Over limit)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Tabs defaultValue="write" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="write">Write</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                      </TabsList>
                      <TabsContent value="write" className="mt-4">
                        <Textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Start writing your essay here..."
                          className="min-h-[400px] font-mono"
                        />
                      </TabsContent>
                      <TabsContent value="preview" className="mt-4">
                        <div className="prose max-w-none min-h-[400px] p-4 border rounded-md">
                          {content.split("\n").map((paragraph, index) => (
                            <p key={index} className="mb-4">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={() => handleHumanize(content)}
                      disabled={isHumanizing}
                    >
                      {isHumanizing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Humanizing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Humanize
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={savingDraft || !title || !content}
                    >
                      {savingDraft ? "Saving..." : "Save Draft"}
                    </Button>
                    <Button
                      onClick={handleGetFeedback}
                      disabled={loading || !title || !content}
                    >
                      {loading ? "Getting Feedback..." : "Get Feedback"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {feedback && (
                <Card>
                  <CardHeader>
                    <CardTitle>Essay Feedback</CardTitle>
                    <CardDescription>
                      AI-powered feedback and suggestions for improvement
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <h3 className="font-medium">Overall Score</h3>
                        <div className="text-3xl font-bold">
                          {feedback.overallScore}/100
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-medium">General Feedback</h3>
                        <p className="text-muted-foreground">
                          {feedback.generalFeedback}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Detailed Analysis</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {Object.entries(feedback.parameters).map(
                          ([key, value]: [string, any]) => (
                            <Card key={key}>
                              <CardHeader>
                                <CardTitle className="text-base">
                                  {key
                                    .replace(/([A-Z])/g, " $1")
                                    .split("And")
                                    .join(" & ")
                                    .trim()}
                                </CardTitle>
                                <CardDescription>
                                  Score: {value.score}/100
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <p className="text-sm">{value.feedback}</p>
                                {value.suggestions && (
                                  <div>
                                    <p className="text-sm font-medium mt-2">
                                      Suggestions:
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {value.suggestions}
                                    </p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <h3 className="font-medium mb-2">Strengths</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {feedback.strengths.map((strength, idx) => (
                            <li key={idx}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Weaknesses</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {feedback.weaknesses.map((weakness, idx) => (
                            <li key={idx}>{weakness}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">
                          Areas for Improvement
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {feedback.improvementAreas.map((area, idx) => (
                            <li key={idx}>{area}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveDraft}
                      disabled={savingDraft}
                      className="w-full"
                    >
                      {savingDraft ? "Saving..." : "Save Essay with Feedback"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Essay;
