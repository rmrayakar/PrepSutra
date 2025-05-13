import { useState } from "react";
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
import { getEssayFeedback } from "@/integrations/supabase/functions";
import { useToast } from "@/hooks/use-toast";
import type { EssayFeedbackResponse } from "@/integrations/supabase/functions";

const Essay = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState<EssayFeedbackResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      const response = await getEssayFeedback(title, content);
      setFeedback(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get essay feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Essay Builder & Feedback Tool
              </h2>
              <p className="text-muted-foreground mt-2">
                Get frameworks for essay topics and receive detailed feedback on
                your writing
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Essay Topic Explorer</CardTitle>
                <CardDescription>
                  Browse previous UPSC essay topics or explore new ones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="Enter an essay topic..."
                      className="flex-1 rounded-md border p-2"
                    />
                    <Button>Get Framework</Button>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Suggested Topics</h3>
                    <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                      <div className="border rounded-md p-3 hover:bg-accent/50 cursor-pointer">
                        <p className="font-medium">
                          Wisdom finds truth, while knowledge covers facts.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          UPSC 2023
                        </p>
                      </div>
                      <div className="border rounded-md p-3 hover:bg-accent/50 cursor-pointer">
                        <p className="font-medium">
                          The time to repair the roof is when the sun is
                          shining.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          UPSC 2022
                        </p>
                      </div>
                      <div className="border rounded-md p-3 hover:bg-accent/50 cursor-pointer">
                        <p className="font-medium">
                          Inclusivity is the strength of a plural society.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          UPSC 2022
                        </p>
                      </div>
                      <div className="border rounded-md p-3 hover:bg-accent/50 cursor-pointer">
                        <p className="font-medium">
                          Culture is what we give to others; civilization is
                          what we give to ourselves.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          UPSC 2021
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Essay Framework</CardTitle>
                <CardDescription>
                  AI-generated structure for "Wisdom finds truth, while
                  knowledge covers facts"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="framework">
                  <TabsList className="mb-4">
                    <TabsTrigger value="framework">Framework</TabsTrigger>
                    <TabsTrigger value="examples">Examples</TabsTrigger>
                    <TabsTrigger value="references">References</TabsTrigger>
                  </TabsList>

                  <TabsContent value="framework">
                    <div className="space-y-4">
                      <div className="border-l-4 border-prepsutra-primary pl-4 py-2">
                        <h3 className="font-medium">Introduction</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Begin with a philosophical quote about wisdom vs.
                          knowledge. Define both terms clearly. Establish the
                          thesis that wisdom transcends mere knowledge by
                          focusing on truth and meaning.
                        </p>
                      </div>

                      <div className="border-l-4 border-prepsutra-primary pl-4 py-2">
                        <h3 className="font-medium">
                          Body Paragraph 1: The Nature of Knowledge
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Explain how knowledge is acquired, stored, and
                          transmitted. Discuss its factual, empirical nature.
                          Highlight both strengths and limitations of knowledge.
                        </p>
                      </div>

                      <div className="border-l-4 border-prepsutra-primary pl-4 py-2">
                        <h3 className="font-medium">
                          Body Paragraph 2: The Essence of Wisdom
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Contrast wisdom as deeper understanding that comes
                          through experience, reflection, and insight. Explain
                          how wisdom involves discernment, judgment, and seeing
                          beyond facts.
                        </p>
                      </div>

                      <div className="border-l-4 border-prepsutra-primary pl-4 py-2">
                        <h3 className="font-medium">
                          Body Paragraph 3: Historical Examples
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Provide examples from history where knowledge without
                          wisdom led to negative outcomes. Contrast with
                          examples where wisdom guided knowledge toward positive
                          change.
                        </p>
                      </div>

                      <div className="border-l-4 border-prepsutra-primary pl-4 py-2">
                        <h3 className="font-medium">
                          Body Paragraph 4: Contemporary Relevance
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Discuss information age challenges – abundance of
                          knowledge but possible deficit of wisdom. Examine
                          fields like AI, governance, climate change where this
                          distinction matters.
                        </p>
                      </div>

                      <div className="border-l-4 border-prepsutra-primary pl-4 py-2">
                        <h3 className="font-medium">Conclusion</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Synthesize arguments to reinforce the complementary
                          nature of knowledge and wisdom. Emphasize how both are
                          necessary, but wisdom ultimately guides knowledge
                          toward truth and meaning.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="examples">
                    <div className="space-y-4">
                      <div className="border rounded-md p-3">
                        <h3 className="font-medium">
                          Historical Example: Nuclear Technology
                        </h3>
                        <p className="text-sm mt-1">
                          Knowledge gave us nuclear technology; wisdom
                          determines whether it powers cities or destroys them.
                          The Manhattan Project scientists possessed tremendous
                          knowledge but later advocated for wisdom in its
                          application. Robert Oppenheimer's famous quote "Now I
                          am become Death, the destroyer of worlds" reflects
                          this realization.
                        </p>
                      </div>

                      <div className="border rounded-md p-3">
                        <h3 className="font-medium">
                          Philosophical Example: Ancient Traditions
                        </h3>
                        <p className="text-sm mt-1">
                          Contrast Socrates' wisdom ("I know that I know
                          nothing") with the Sophists' knowledge-focused
                          approach. Similarly, Eastern philosophical traditions
                          like Buddhism and Taoism emphasize wisdom over
                          accumulated knowledge.
                        </p>
                      </div>

                      <div className="border rounded-md p-3">
                        <h3 className="font-medium">
                          Contemporary Example: Information Overload
                        </h3>
                        <p className="text-sm mt-1">
                          In today's information age, we have unprecedented
                          access to knowledge via the internet, yet face
                          challenges like misinformation and echo chambers.
                          Wisdom is needed to discern reliable information,
                          understand context, and apply knowledge ethically.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="references">
                    <div className="space-y-4">
                      <div className="border rounded-md p-3">
                        <h3 className="font-medium">
                          Philosophical References
                        </h3>
                        <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                          <li>
                            Aristotle's distinction between episteme (knowledge)
                            and phronesis (practical wisdom)
                          </li>
                          <li>Kant's views on the limits of pure reason</li>
                          <li>
                            Indian philosophical concepts of jnana (knowledge)
                            and prajna (wisdom)
                          </li>
                        </ul>
                      </div>

                      <div className="border rounded-md p-3">
                        <h3 className="font-medium">Literature & Quotations</h3>
                        <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                          <li>
                            "Knowledge comes, but wisdom lingers." - Alfred Lord
                            Tennyson
                          </li>
                          <li>
                            "The only true wisdom is in knowing you know
                            nothing." - Socrates
                          </li>
                          <li>
                            "Wisdom is not a product of schooling but of the
                            lifelong attempt to acquire it." - Albert Einstein
                          </li>
                        </ul>
                      </div>

                      <div className="border rounded-md p-3">
                        <h3 className="font-medium">Contemporary Thinkers</h3>
                        <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                          <li>
                            Daniel Kahneman's work on cognitive biases and
                            decision-making
                          </li>
                          <li>
                            Yuval Noah Harari's discussions on knowledge in the
                            information age
                          </li>
                          <li>
                            Amartya Sen's capability approach that extends
                            beyond mere knowledge
                          </li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Essay Writer</CardTitle>
                <CardDescription>
                  Write your essay and get AI feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Enter essay title..."
                      className="w-full rounded-md border p-2 mb-4"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <textarea
                      className="w-full h-64 rounded-md border p-3"
                      placeholder="Start writing your essay here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Word count:{" "}
                        {content.split(/\s+/).filter(Boolean).length}/1000
                      </p>
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline">Save Draft</Button>
                      <Button onClick={handleGetFeedback} disabled={loading}>
                        {loading ? "Getting Feedback..." : "Get Feedback"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {feedback && (
              <Card>
                <CardHeader>
                  <CardTitle>Feedback Analysis</CardTitle>
                  <CardDescription>
                    AI-powered review of your essay
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      {Object.entries(feedback.parameters).map(
                        ([key, value]) => (
                          <div key={key}>
                            <h3 className="font-medium capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </h3>
                            <div className="flex items-center mt-1">
                              <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-prepsutra-primary rounded-full"
                                  style={{
                                    width: `${(value.score / 10) * 100}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="ml-2 text-sm">
                                {value.score}/10
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {value.feedback}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              <strong>Suggestions:</strong> {value.suggestions}
                            </p>
                          </div>
                        )
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium">Overall Score</h3>
                        <div className="flex items-center mt-1">
                          <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-prepsutra-primary rounded-full"
                              style={{ width: `${feedback.overallScore}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm">
                            {feedback.overallScore}/100
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium">General Feedback</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {feedback.generalFeedback}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium">Strengths</h3>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                          {feedback.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-medium">Areas for Improvement</h3>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                          {feedback.improvementAreas.map((area, index) => (
                            <li key={index}>{area}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Essay;
