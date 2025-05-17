import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

interface CSVQuestion {
  question_text: string;
  year: number;
  subject: string;
  exam_type: string;
  keywords: string[];
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  question_type: string;
  marks: number;
}

const UploadQuestions = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // Define valid subjects at component level
  const validSubjects = [
    "History",
    "Geography",
    "Polity",
    "Economy",
    "Environment",
    "Science & Tech",
    "International Relations",
    "Ethics",
    "Essay",
    "General Studies",
    "GS1",
    "GS2",
    "GS3",
    "GS4",
  ];

  // Add validation for GS paper categories
  const validateSubject = (subject: string): boolean => {
    return validSubjects.includes(subject);
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate("/questions");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        // Check if data exists and has username property
        if (!data || typeof data !== "object") {
          throw new Error("Profile data not found");
        }

        const username = (data as any).username;
        if (typeof username !== "string" || username !== "rmrayakar2004") {
          toast.error("Only admins can access this page");
          navigate("/questions");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Error checking admin status:", error);
        toast.error("Error verifying admin status");
        navigate("/questions");
      }
    };

    checkAdminStatus();
  }, [user, navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
    } else {
      toast.error("Please select a valid CSV file");
    }
  };

  const parseCSV = async (file: File): Promise<CSVQuestion[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split("\n");
          const headers = lines[0].split(",").map((h) => h.trim());

          const questions: CSVQuestion[] = [];
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const values = lines[i].split(",").map((v) => v.trim());
            const subject =
              values[headers.indexOf("subject")] || "General Studies";

            // Validate subject
            if (!validateSubject(subject)) {
              throw new Error(
                `Invalid subject "${subject}" in line ${
                  i + 1
                }. Valid subjects are: ${validSubjects.join(", ")}`
              );
            }

            const question: CSVQuestion = {
              question_text: values[headers.indexOf("question_text")] || "",
              year:
                parseInt(values[headers.indexOf("year")]) ||
                new Date().getFullYear(),
              subject: subject,
              exam_type: values[headers.indexOf("exam_type")] || "Prelims",
              keywords: (values[headers.indexOf("keywords")] || "")
                .split(";")
                .map((k) => k.trim()),
              options: values[headers.indexOf("options")]
                ? values[headers.indexOf("options")]
                    .split(";")
                    .map((o) => o.trim())
                : undefined,
              correct_answer:
                values[headers.indexOf("correct_answer")] || undefined,
              explanation: values[headers.indexOf("explanation")] || undefined,
              question_type: values[headers.indexOf("question_type")] || "mcq",
              marks: parseInt(values[headers.indexOf("marks")]) || 1,
            };
            questions.push(question);
          }
          resolve(questions);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const uploadQuestions = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      const questions = await parseCSV(file);
      const totalQuestions = questions.length;
      let uploadedCount = 0;

      for (const question of questions) {
        const { error } = await supabase.from("exam_questions").insert([
          {
            ...question,
            is_database_question: true,
            user_id: user?.id,
          },
        ]);

        if (error) {
          console.error("Error uploading question:", error);
          throw error;
        }

        uploadedCount++;
        setProgress((uploadedCount / totalQuestions) * 100);
      }

      toast.success(`Successfully uploaded ${totalQuestions} questions`);
      navigate("/questions");
    } catch (error: any) {
      console.error("Error uploading questions:", error);
      toast.error(error.message || "Failed to upload questions");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Upload Questions
              </h1>
              <p className="text-muted-foreground">
                Upload multiple questions using a CSV file
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/questions")}>
              Back to Questions
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upload Questions</CardTitle>
              <CardDescription>
                Upload a CSV file containing multiple questions. The CSV should
                have the following columns: question_text, year, subject,
                exam_type, keywords, options (optional), correct_answer
                (optional), explanation (optional), question_type, marks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="csv-file">CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                </div>

                {file && (
                  <div className="text-sm text-muted-foreground">
                    Selected file: {file.name}
                  </div>
                )}

                {uploading && (
                  <div className="space-y-2">
                    <Progress value={progress} />
                    <p className="text-sm text-muted-foreground">
                      Uploading... {Math.round(progress)}%
                    </p>
                  </div>
                )}

                <Button onClick={uploadQuestions} disabled={!file || uploading}>
                  {uploading ? "Uploading..." : "Upload Questions"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default UploadQuestions;
