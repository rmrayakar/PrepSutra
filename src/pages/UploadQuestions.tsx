import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
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

const validateSubject = (subject: string): boolean => {
  return validSubjects.includes(subject);
};

const UploadQuestions = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate("/questions");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (error || !data || data.username !== "rmrayakar2004") {
        toast.error("Only admins can access this page");
        navigate("/questions");
      } else {
        setIsAdmin(true);
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
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const questions: CSVQuestion[] = [];

          try {
            for (let i = 0; i < results.data.length; i++) {
              const row: any = results.data[i];
              const subject = row.subject?.trim() || "General Studies";

              if (!validateSubject(subject)) {
                throw new Error(
                  `Invalid subject "${subject}" in row ${
                    i + 2
                  }. Valid subjects: ${validSubjects.join(", ")}`
                );
              }

              const year = parseInt(row.year);
              const marks = parseInt(row.marks);

              questions.push({
                question_text: row.question_text?.trim() || "",
                year: isNaN(year) ? new Date().getFullYear() : year,
                subject,
                exam_type: row.exam_type?.trim() || "Prelims",
                keywords: (row.keywords || "")
                  .split(";")
                  .map((k: string) => k.trim())
                  .filter(Boolean),
                options: row.options
                  ? row.options.split(";").map((o: string) => o.trim())
                  : undefined,
                correct_answer: row.correct_answer?.trim() || undefined,
                explanation: row.explanation?.trim() || undefined,
                question_type: row.question_type?.trim() || "mcq",
                marks: isNaN(marks) ? 1 : marks,
              });
            }
            resolve(questions);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error),
      });
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
      const total = questions.length;

      const payload = questions.map((q) => ({
        ...q,
        is_database_question: true,
        user_id: user?.id,
      }));

      const batchSize = 100;
      for (let i = 0; i < payload.length; i += batchSize) {
        const batch = payload.slice(i, i + batchSize);
        const { error } = await supabase.from("exam_questions").insert(batch);

        if (error) throw error;
        setProgress(((i + batch.length) / total) * 100);
      }

      toast.success(`Successfully uploaded ${total} questions`);
      navigate("/questions");
    } catch (error: any) {
      console.error("Upload error:", error);
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
                Upload a CSV file with the following columns: <br />
                <strong>
                  question_text, year, subject, exam_type, keywords, options
                  (optional), correct_answer (optional), explanation (optional),
                  question_type, marks
                </strong>
                <br />
                <a
                  href="/sample_questions.csv"
                  download
                  className="text-blue-600 hover:underline text-sm"
                >
                  📥 Download Sample CSV Template
                </a>
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
