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
import { generateModelAnswer } from "@/integrations/supabase/functions";
import { useToast } from "@/hooks/use-toast";

const Questions = () => {
  const [selectedQuestion, setSelectedQuestion] = useState<{
    topic: string;
    question: string;
  } | null>(null);
  const [modelAnswer, setModelAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateAnswer = async () => {
    if (!selectedQuestion) return;

    try {
      setLoading(true);
      const response = await generateModelAnswer(
        selectedQuestion.topic,
        selectedQuestion.question
      );
      setModelAnswer(response.modelAnswer);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate model answer. Please try again.",
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
                PYQ Analyzer
              </h2>
              <p className="text-muted-foreground mt-2">
                Filter and analyze UPSC previous year questions with
                AI-generated model answers
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Question Filter</CardTitle>
                <CardDescription>
                  Find questions based on topics, years, and paper type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Exam Type
                    </label>
                    <select className="w-full rounded-md border p-2">
                      <option>Prelims</option>
                      <option>Mains</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Year Range
                    </label>
                    <select className="w-full rounded-md border p-2">
                      <option>Last 5 Years</option>
                      <option>Last 10 Years</option>
                      <option>All Years</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Subject
                    </label>
                    <select className="w-full rounded-md border p-2">
                      <option>History</option>
                      <option>Geography</option>
                      <option>Polity</option>
                      <option>Economy</option>
                      <option>Environment</option>
                      <option>Science & Tech</option>
                      <option>International Relations</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium mb-1 block">
                    Topic Keywords (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. Constitution, Environment, Fiscal Policy"
                    className="w-full rounded-md border p-2"
                  />
                </div>
                <Button className="mt-4">Search Questions</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>
                  Found 24 questions matching your criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="prelims">
                  <TabsList className="mb-4">
                    <TabsTrigger value="prelims">Prelims</TabsTrigger>
                    <TabsTrigger value="mains">Mains</TabsTrigger>
                  </TabsList>

                  <TabsContent value="prelims" className="space-y-4">
                    <div className="rounded-md border p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">
                            Which of the following are the objectives of the
                            National Watershed Development Project?
                          </h3>
                          <div className="flex items-center gap-2 my-2">
                            <span className="bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded-full">
                              Environment
                            </span>
                            <span className="bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded-full">
                              2023
                            </span>
                          </div>
                          <div className="mt-3 space-y-2">
                            <div className="flex gap-2">
                              <span className="font-medium">1.</span>
                              <p>Restoration of ecological balance</p>
                            </div>
                            <div className="flex gap-2">
                              <span className="font-medium">2.</span>
                              <p>
                                Harvesting and recycling rainwater in rainfed
                                areas
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <span className="font-medium">3.</span>
                              <p>
                                Creation of sustained employment opportunities
                              </p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="font-medium">
                              Select the correct answer using the code given
                              below:
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-2">
                                <input type="radio" name="q1" id="q1a" />
                                <label htmlFor="q1a">1 and 2 only</label>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="radio" name="q1" id="q1b" />
                                <label htmlFor="q1b">2 and 3 only</label>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="radio" name="q1" id="q1c" />
                                <label htmlFor="q1c">1 and 3 only</label>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="radio" name="q1" id="q1d" />
                                <label htmlFor="q1d">1, 2 and 3</label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedQuestion({
                                topic: "Environment",
                                question:
                                  "Which of the following are the objectives of the National Watershed Development Project?",
                              });
                              handleGenerateAnswer();
                            }}
                            disabled={loading}
                          >
                            {loading ? "Generating..." : "View Answer"}
                          </Button>
                          <Button variant="outline" size="sm">
                            Save Question
                          </Button>
                        </div>
                      </div>
                      {modelAnswer &&
                        selectedQuestion?.question ===
                          "Which of the following are the objectives of the National Watershed Development Project?" && (
                          <div className="mt-4 p-4 bg-muted/30 rounded-md">
                            <h4 className="font-medium mb-2">Model Answer:</h4>
                            <p className="text-sm whitespace-pre-wrap">
                              {modelAnswer}
                            </p>
                          </div>
                        )}
                    </div>

                    <div className="rounded-md border p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">
                            Consider the following statements with reference to
                            the Green Climate Fund:
                          </h3>
                          <div className="flex items-center gap-2 my-2">
                            <span className="bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded-full">
                              Environment
                            </span>
                            <span className="bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded-full">
                              2022
                            </span>
                          </div>
                          <div className="mt-3 space-y-2">
                            <div className="flex gap-2">
                              <span className="font-medium">1.</span>
                              <p>
                                It was established in 2010 under the UNFCCC.
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <span className="font-medium">2.</span>
                              <p>
                                It helps developing countries reduce greenhouse
                                gas emissions.
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <span className="font-medium">3.</span>
                              <p>It is headquartered in Geneva, Switzerland.</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="font-medium">
                              Which of the statements given above is/are
                              correct?
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-2">
                                <input type="radio" name="q2" id="q2a" />
                                <label htmlFor="q2a">1 and 2 only</label>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="radio" name="q2" id="q2b" />
                                <label htmlFor="q2b">2 only</label>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="radio" name="q2" id="q2c" />
                                <label htmlFor="q2c">1 and 3 only</label>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="radio" name="q2" id="q2d" />
                                <label htmlFor="q2d">1, 2 and 3</label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm">
                            View Answer
                          </Button>
                          <Button variant="outline" size="sm">
                            Save Question
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="mains">
                    <p className="text-muted-foreground">
                      Mains questions will appear here.
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Topic Analysis</CardTitle>
                  <CardDescription>
                    Recurring themes in previous years
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-md">
                    <p className="text-muted-foreground">
                      Topic analysis charts will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Question Patterns</CardTitle>
                  <CardDescription>
                    How question styles have evolved
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-md">
                    <p className="text-muted-foreground">
                      Pattern analysis will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Questions;
