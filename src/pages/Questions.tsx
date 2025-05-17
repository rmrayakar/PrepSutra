import { useEffect, useState } from "react";
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
  generateModelAnswer,
  searchExamQuestions,
  addExamQuestion,
  getExamSubjects,
  QuestionSearchParams,
  getUserAnswer,
  deleteExamQuestion,
  submitAnswer,
} from "@/integrations/supabase/functions";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Available subject options
const SUBJECTS = [
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

// Question types
const QUESTION_TYPES = [
  { value: "mcq", label: "Multiple Choice" },
  { value: "descriptive", label: "Descriptive" },
  { value: "short_answer", label: "Short Answer" },
  { value: "match", label: "Matching Type" },
  { value: "case_study", label: "Case Study" },
];

// Year range options
const YEAR_RANGES = [
  {
    label: "Last 5 Years",
    start: new Date().getFullYear() - 5,
    end: new Date().getFullYear(),
  },
  {
    label: "Last 10 Years",
    start: new Date().getFullYear() - 10,
    end: new Date().getFullYear(),
  },
  { label: "All Years", start: 1990, end: new Date().getFullYear() },
];

interface ExamQuestion {
  id: string;
  question_text: string;
  year: number;
  subject: string;
  exam_type: string;
  keywords: string[];
  options?: string[] | null;
  correct_answer?: string | null;
  explanation?: string | null;
  question_type?: string;
  marks: number;
  user_id?: string | null;
  is_database_question: boolean;
  created_at: string;
  updated_at: string;
}

interface QuestionAnswer {
  id: string;
  question_id: string;
  user_id: string;
  answer_text: string;
  similarity_score?: number | null;
  awarded_marks?: number | null;
  created_at: string;
  updated_at: string;
}

// Add new interfaces for analysis data
interface TopicAnalysis {
  topics: { name: string; count: number }[];
  subjectDistribution: { subject: string; count: number }[];
}

interface QuestionPattern {
  questionTypes: { type: string; count: number }[];
  yearTrend: { year: number; count: number }[];
}

const Questions = () => {
  // State for filtering and searching
  const [examType, setExamType] = useState<string>("Prelims");
  const [yearRange, setYearRange] = useState<string>("Last 5 Years");
  const [subject, setSubject] = useState<string>("all");
  const [questionType, setQuestionType] = useState<string>("all");
  const [keywordsInput, setKeywordsInput] = useState<string>("");
  const [sortBy, setSortBy] = useState<
    "year" | "subject" | "exam_type" | "question_type"
  >("year");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [questionsView, setQuestionsView] = useState<"all" | "my">("all");

  // State for questions data
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [subjects, setSubjects] = useState<string[]>(SUBJECTS);

  // State for adding new question
  const [addQuestionOpen, setAddQuestionOpen] = useState<boolean>(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    year: new Date().getFullYear(),
    subject: "General Studies",
    exam_type: "Prelims",
    keywords: [] as string[],
    options: ["", "", "", ""],
    correct_answer: "",
    explanation: "",
    question_type: "mcq",
    marks: 1,
  });

  // State for submitting answers
  const [activeAnswer, setActiveAnswer] = useState<{
    questionId: string;
    answerText: string;
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [submittingAnswer, setSubmittingAnswer] = useState<boolean>(false);

  // State for model answers
  const [selectedQuestion, setSelectedQuestion] = useState<ExamQuestion | null>(
    null
  );
  const [modelAnswer, setModelAnswer] = useState<string | null>(null);
  const [answerLoading, setAnswerLoading] = useState<boolean>(false);

  // Add new state to track saved questions
  const [savedQuestionIds, setSavedQuestionIds] = useState<Set<string>>(
    new Set()
  );

  // Add new state for analysis data
  const [topicAnalysis, setTopicAnalysis] = useState<TopicAnalysis>({
    topics: [],
    subjectDistribution: [],
  });
  const [questionPattern, setQuestionPattern] = useState<QuestionPattern>({
    questionTypes: [],
    yearTrend: [],
  });
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // Add useEffect to check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setIsAdmin(data?.username === "rmrayakar2004");
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Modify useEffect to also fetch saved questions
  useEffect(() => {
    fetchQuestions();
    fetchSubjects();
    fetchSavedQuestions();
  }, [
    examType,
    yearRange,
    subject,
    sortBy,
    sortOrder,
    questionsView,
    questionType,
  ]);

  // Add new useEffect for analysis
  useEffect(() => {
    if (questions.length > 0) {
      analyzeQuestions();
    }
  }, [questions]);

  const fetchSubjects = async () => {
    try {
      const data = await getExamSubjects();
      if (data && data.length > 0) {
        // Merge with predefined subjects and remove duplicates
        const allSubjects = [...new Set([...SUBJECTS, ...data])];
        setSubjects(allSubjects);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);

      // Prepare search parameters
      const selectedYearRange = YEAR_RANGES.find(
        (yr) => yr.label === yearRange
      );

      const keywords = keywordsInput
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const params: QuestionSearchParams = {
        examType,
        subject: subject === "all" ? undefined : subject,
        question_type: questionType === "all" ? undefined : questionType,
        yearStart: selectedYearRange?.start,
        yearEnd: selectedYearRange?.end,
        keywords: keywords.length > 0 ? keywords : undefined,
        sortBy,
        sortOrder,
        limit: 50,
        userQuestionsOnly: questionsView === "my",
      };

      const result = await searchExamQuestions(params);
      setQuestions(result.questions);
      setTotalQuestions(result.count);

      // Fetch user answers for these questions
      if (result.questions.length > 0) {
        await loadAnswersForQuestions(result.questions.map((q) => q.id));
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load user answers for a list of question IDs
  const loadAnswersForQuestions = async (questionIds: string[]) => {
    try {
      const answersMap: Record<string, QuestionAnswer> = {};

      for (const qId of questionIds) {
        const answer = await getUserAnswer(qId);
        if (answer) {
          answersMap[qId] = answer;
        }
      }

      setAnswers(answersMap);
    } catch (error) {
      console.error("Error loading answers:", error);
    }
  };

  // Add function to fetch saved questions
  const fetchSavedQuestions = async () => {
    try {
      const result = await searchExamQuestions({
        userQuestionsOnly: true,
      });

      // Create a Set of original question IDs that the user has saved
      const savedIds = new Set(
        result.questions
          .filter((q) => !q.is_database_question)
          .map((q) => q.question_text) // Use question_text as a unique identifier since original ID won't match
      );

      setSavedQuestionIds(savedIds);
    } catch (error) {
      console.error("Error fetching saved questions:", error);
    }
  };

  const resetQuestionForm = () => {
    setNewQuestion({
      question_text: "",
      year: new Date().getFullYear(),
      subject: "General Studies",
      exam_type: "Prelims",
      keywords: [],
      options: ["", "", "", ""],
      correct_answer: "",
      explanation: "",
      question_type: "mcq",
      marks: 1,
    });
    setKeywordsInput("");
  };

  const handleAddQuestion = async () => {
    try {
      // Process keywords from comma-separated to array
      const processedKeywords =
        newQuestion.keywords.length > 0
          ? newQuestion.keywords
          : keywordsInput
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean);

      // Prepare question data based on question type
      const questionData: any = {
        ...newQuestion,
        keywords: processedKeywords,
      };

      // Only include options and correct_answer for MCQ type
      if (newQuestion.question_type !== "mcq") {
        delete questionData.options;
        delete questionData.correct_answer;
      }

      await addExamQuestion(questionData);

      setAddQuestionOpen(false);
      toast({
        title: "Success",
        description: "Question added successfully",
      });

      // Reset form and refresh questions
      resetQuestionForm();
      fetchQuestions();
    } catch (error) {
      console.error("Error adding question:", error);
      toast({
        title: "Error",
        description: "Failed to add question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeywordsInput(e.target.value);

    // Update new question keywords for the form
    setNewQuestion((prev) => ({
      ...prev,
      keywords: e.target.value
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    }));
  };

  const handleGenerateAnswer = async (question: ExamQuestion) => {
    if (!question) return;

    // If the question is already selected, hide the answer
    if (selectedQuestion?.id === question.id) {
      setSelectedQuestion(null);
      setModelAnswer(null);
      return;
    }

    try {
      setAnswerLoading(true);
      setSelectedQuestion(question);

      // Generate model answer using Gemini API
      const response = await generateModelAnswer(
        question.subject,
        question.question_text
      );

      setModelAnswer(response.modelAnswer);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnswerLoading(false);
    }
  };

  // Modify handleSaveQuestion to update savedQuestionIds
  const handleSaveQuestion = async (question: ExamQuestion) => {
    try {
      // Create a new question object without the id and database-specific fields
      const newQuestionData = {
        question_text: question.question_text,
        year: question.year,
        subject: question.subject,
        exam_type: question.exam_type,
        keywords: question.keywords,
        options: question.options,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        question_type: question.question_type,
        marks: question.marks,
        is_database_question: false, // This will be a user question
      };

      await addExamQuestion(newQuestionData);

      // Update the saved questions state
      setSavedQuestionIds((prev) => new Set([...prev, question.question_text]));

      toast({
        title: "Success",
        description: "Question saved to your collection successfully",
      });

      // Refresh questions if we're in the "My Questions" view
      if (questionsView === "my") {
        fetchQuestions();
      }
    } catch (error) {
      console.error("Error saving question:", error);
      toast({
        title: "Error",
        description: "Failed to save the question. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Modify handleDeleteQuestion to update savedQuestionIds
  const handleDeleteQuestion = async (questionId: string) => {
    if (!questionId) return;

    try {
      const questionToDelete = questions.find((q) => q.id === questionId);
      if (!questionToDelete) return;

      await deleteExamQuestion(questionId);

      // Remove from saved questions tracking
      setSavedQuestionIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(questionToDelete.question_text);
        return newSet;
      });

      // Update local state after successful deletion
      setQuestions(questions.filter((q) => q.id !== questionId));

      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: "Error",
        description: "Failed to delete the question. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle submitting an answer to a question
  const handleSubmitAnswer = async (questionId: string, answerText: string) => {
    if (!questionId || !answerText.trim()) return;

    try {
      setSubmittingAnswer(true);
      const question = questions.find((q) => q.id === questionId);

      if (!question) {
        throw new Error("Question not found");
      }

      let modelAnswerText = "";
      let answerEvaluation = {
        id: questionId,
        question_id: questionId,
        user_id: "local",
        answer_text: answerText,
        similarity_score: 0,
        awarded_marks: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Different handling for MCQ vs descriptive questions
      if (question.question_type === "mcq") {
        // For MCQ, get the model answer first
        const mcqResponse = await generateModelAnswer(
          question.subject,
          `This is a multiple choice question. Please provide ONLY the correct option letter (A, B, C, or D) without any explanation.

          Question: ${question.question_text}
          Options:
          ${question.options
            ?.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`)
            .join("\n")}
          `
        );

        // Extract just the option letter from response
        const correctAnswer = mcqResponse.modelAnswer.trim().charAt(0);
        const userAnswer = answerText.trim().toUpperCase().charAt(0);
        const isCorrect = correctAnswer === userAnswer;

        // Create evaluation text
        modelAnswerText = `Score: ${isCorrect ? question.marks : 0}
Explanation: ${
          isCorrect ? "Correct! " : "Incorrect. "
        }You selected option ${userAnswer}.
The correct answer is option ${correctAnswer}: ${
          question.options?.[correctAnswer.charCodeAt(0) - 65]
        }

Key Points Covered:
${
  isCorrect
    ? "• Selected the correct option\n• Demonstrated understanding of the concept"
    : "• Selected incorrect option\n• Review the concept carefully"
}

Areas for Improvement:
${
  isCorrect
    ? "• Continue practicing similar questions to maintain understanding"
    : `• Review why option ${correctAnswer} is the correct answer\n• Understand the key concepts related to this question`
}`;

        answerEvaluation = {
          ...answerEvaluation,
          similarity_score: isCorrect ? 1 : 0,
          awarded_marks: isCorrect ? question.marks : 0,
        };
      } else {
        // For descriptive questions, use the existing evaluation logic
        const descResponse = await generateModelAnswer(
          question.subject,
          `Please evaluate this answer for the following question and provide:
          1. A score out of ${question.marks} marks
          2. Detailed explanation of the evaluation
          3. Key points covered correctly
          4. Areas of improvement
          
          Question: ${question.question_text}
          
          Student's Answer: ${answerText}
          
          Format your response as:
          Score: [number]
          Explanation: [detailed explanation]
          Key Points Covered: [bullet points]
          Areas for Improvement: [bullet points]`
        );

        modelAnswerText = descResponse.modelAnswer;
        answerEvaluation = {
          ...answerEvaluation,
          awarded_marks: parseFloat(
            descResponse.modelAnswer.match(/Score:\s*(\d+\.?\d*)/)?.[1] || "0"
          ),
        };
      }

      // Update states
      setAnswers((prev) => ({
        ...prev,
        [questionId]: answerEvaluation,
      }));

      setActiveAnswer(null);
      setSelectedQuestion(question);
      setModelAnswer(modelAnswerText);

      toast({
        title: "Answer Evaluated",
        description:
          "Your answer has been evaluated by AI. Check the response for detailed feedback.",
      });
    } catch (error) {
      console.error("Error evaluating answer:", error);
      toast({
        title: "Error",
        description: "Failed to evaluate your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Render question options based on question type
  const renderQuestionOptions = () => {
    switch (newQuestion.question_type) {
      case "mcq":
        return (
          <div className="flex flex-col">
            <Label>Options</Label>
            <br />
            <div className="grid grid-cols-2 gap-2 mt-2">
              {newQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span>{String.fromCharCode(65 + index)}.</span>
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(newQuestion.options || [])];
                      newOptions[index] = e.target.value;
                      setNewQuestion({
                        ...newQuestion,
                        options: newOptions,
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      case "descriptive":
      case "short_answer":
      case "case_study":
        return null;
      default:
        return null;
    }
  };

  // Function to render question content based on question type
  const renderQuestionContent = (question: ExamQuestion) => {
    // For MCQ questions with options
    if (
      question.question_type === "mcq" &&
      question.options &&
      question.options.length > 0
    ) {
      return (
        <div className="mt-3 space-y-2">
          {question.options.map((option, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="font-medium">
                {String.fromCharCode(65 + idx)}.
              </span>
              <p>{option}</p>
            </div>
          ))}
        </div>
      );
    }

    // For non-MCQ questions, just display a badge with the question type
    return (
      <div className="mt-2">
        <span className="bg-purple-100 text-purple-700 text-xs py-1 px-2 rounded-full">
          {QUESTION_TYPES.find((t) => t.value === question.question_type)
            ?.label || "Question"}
        </span>
      </div>
    );
  };

  // Modify renderQuestionActions to check if question is saved
  const renderQuestionActions = (question: ExamQuestion) => {
    const isQuestionSaved = savedQuestionIds.has(question.question_text);

    return (
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleGenerateAnswer(question)}
          disabled={answerLoading}
        >
          {answerLoading && selectedQuestion?.id === question.id
            ? "Loading..."
            : selectedQuestion?.id === question.id
            ? "Hide Answer"
            : "View Answer"}
        </Button>

        {/* Answer submission button - for MCQ and non-MCQ questions */}
        {!answers[question.id] && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setActiveAnswer({
                questionId: question.id,
                answerText: "",
              })
            }
          >
            Submit Answer
          </Button>
        )}

        {/* Show "View My Answer" for questions with submitted answers */}
        {answers[question.id] && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setActiveAnswer({
                questionId: question.id,
                answerText: answers[question.id].answer_text,
              })
            }
          >
            View My Answer
          </Button>
        )}

        {/* Show Save button only for database questions that haven't been saved */}
        {question.is_database_question && !isQuestionSaved && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSaveQuestion(question)}
          >
            Save to My Questions
          </Button>
        )}

        {/* Show delete button only for user-created questions */}
        {!question.is_database_question && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteQuestion(question.id)}
          >
            Delete
          </Button>
        )}
      </div>
    );
  };

  // Render answer submission form or display existing answer
  const renderAnswerSection = (question: ExamQuestion) => {
    const answer = answers[question.id];
    const isActiveQuestion =
      activeAnswer && activeAnswer.questionId === question.id;

    if (isActiveQuestion) {
      return (
        <div className="mt-4 p-4 bg-muted/30 rounded-md">
          <h4 className="font-medium mb-2">Submit Your Answer:</h4>

          {question.question_type === "mcq" ? (
            // MCQ Answer submission
            <div className="space-y-2 mb-4">
              {question.options?.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`option-${question.id}-${idx}`}
                    name={`mcq-answer-${question.id}`}
                    value={String.fromCharCode(65 + idx)}
                    checked={
                      activeAnswer.answerText === String.fromCharCode(65 + idx)
                    }
                    onChange={() =>
                      setActiveAnswer({
                        ...activeAnswer,
                        answerText: String.fromCharCode(65 + idx),
                      })
                    }
                    className="h-4 w-4 rounded-full"
                  />
                  <label
                    htmlFor={`option-${question.id}-${idx}`}
                    className="text-sm cursor-pointer"
                  >
                    {String.fromCharCode(65 + idx)}. {option}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            // Descriptive answer submission
            <Textarea
              rows={6}
              placeholder="Type your answer here..."
              value={activeAnswer.answerText}
              onChange={(e) =>
                setActiveAnswer({
                  ...activeAnswer,
                  answerText: e.target.value,
                })
              }
              className="mb-2 w-full"
            />
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveAnswer(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() =>
                handleSubmitAnswer(question.id, activeAnswer.answerText)
              }
              disabled={submittingAnswer || !activeAnswer.answerText.trim()}
            >
              {submittingAnswer ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      );
    } else if (answer) {
      // Display submitted answer with score
      return (
        <div className="mt-4 p-4 bg-green-50 rounded-md">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium">Your Answer:</h4>
            <div className="text-sm bg-green-100 text-green-800 py-1 px-2 rounded">
              Score: {answer.awarded_marks?.toFixed(2) || 0}/{question.marks}
              {answer.similarity_score !== null && (
                <span>
                  {" "}
                  ({Math.round((answer.similarity_score || 0) * 100)}% match)
                </span>
              )}
            </div>
          </div>
          <div className="text-sm whitespace-pre-wrap">
            {question.question_type === "mcq" ? (
              <div className="flex items-center gap-2">
                <span>Selected Option: {answer.answer_text}</span>
                {question.options && (
                  <span className="text-gray-600">
                    ({question.options[answer.answer_text.charCodeAt(0) - 65]})
                  </span>
                )}
              </div>
            ) : (
              answer.answer_text
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // Add new function to analyze questions
  const analyzeQuestions = () => {
    if (!questions.length) return;

    setAnalysisLoading(true);
    try {
      // Analyze topics and keywords
      const topicCounts = new Map<string, number>();
      const subjectCounts = new Map<string, number>();
      const questionTypeCounts = new Map<string, number>();
      const yearCounts = new Map<number, number>();

      questions.forEach((question) => {
        // Count topics/keywords
        question.keywords.forEach((keyword) => {
          topicCounts.set(keyword, (topicCounts.get(keyword) || 0) + 1);
        });

        // Count subjects
        subjectCounts.set(
          question.subject,
          (subjectCounts.get(question.subject) || 0) + 1
        );

        // Count question types
        questionTypeCounts.set(
          question.question_type,
          (questionTypeCounts.get(question.question_type) || 0) + 1
        );

        // Count by year
        yearCounts.set(question.year, (yearCounts.get(question.year) || 0) + 1);
      });

      // Convert maps to arrays and sort by count
      const topics = Array.from(topicCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 topics

      const subjectDistribution = Array.from(subjectCounts.entries())
        .map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count);

      const questionTypes = Array.from(questionTypeCounts.entries())
        .map(([type, count]) => ({
          type: QUESTION_TYPES.find((t) => t.value === type)?.label || type,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      const yearTrend = Array.from(yearCounts.entries())
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => a.year - b.year);

      setTopicAnalysis({ topics, subjectDistribution });
      setQuestionPattern({ questionTypes, yearTrend });
    } catch (error) {
      console.error("Error analyzing questions:", error);
      toast({
        title: "Error",
        description: "Failed to analyze questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  PYQ Analyzer
                </h2>
                <p className="text-muted-foreground mt-2">
                  Filter and analyze UPSC previous year questions with
                  AI-generated model answers
                </p>
              </div>

              <div className="flex gap-2">
                {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => navigate("/questions/upload")}
                  >
                    Upload Questions
                  </Button>
                )}
                <Dialog
                  open={addQuestionOpen}
                  onOpenChange={setAddQuestionOpen}
                >
                  <DialogTrigger asChild>
                    <Button>Add New Question</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Question</DialogTitle>
                      <DialogDescription>
                        Enter the details of the previous year question
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <Label htmlFor="exam-type">Exam Type</Label>
                          <br />
                          <Select
                            value={newQuestion.exam_type}
                            onValueChange={(value) =>
                              setNewQuestion({
                                ...newQuestion,
                                exam_type: value,
                              })
                            }
                          >
                            <SelectTrigger id="exam-type">
                              <SelectValue placeholder="Select exam type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Prelims">Prelims</SelectItem>
                              <SelectItem value="Mains">Mains</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex flex-col">
                          <Label htmlFor="year">Year</Label>
                          <br />
                          <Input
                            id="year"
                            type="number"
                            value={newQuestion.year}
                            onChange={(e) =>
                              setNewQuestion({
                                ...newQuestion,
                                year: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <Label htmlFor="subject">Subject</Label>
                          <br />
                          <Select
                            value={newQuestion.subject}
                            onValueChange={(value) =>
                              setNewQuestion({ ...newQuestion, subject: value })
                            }
                          >
                            <SelectTrigger id="subject">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((subj) => (
                                <SelectItem key={subj} value={subj}>
                                  {subj}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex flex-col">
                          <Label htmlFor="question-type">Question Type</Label>
                          <br />
                          <Select
                            value={newQuestion.question_type}
                            onValueChange={(value) =>
                              setNewQuestion({
                                ...newQuestion,
                                question_type: value,
                              })
                            }
                          >
                            <SelectTrigger id="question-type">
                              <SelectValue placeholder="Select question type" />
                            </SelectTrigger>
                            <SelectContent>
                              {QUESTION_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <Label htmlFor="keywords">
                            Keywords (comma-separated)
                          </Label>
                          <br />
                          <Input
                            id="keywords"
                            value={keywordsInput}
                            onChange={handleKeywordChange}
                            placeholder="e.g. Constitution, Environment, Economy"
                          />
                        </div>

                        <div className="flex flex-col">
                          <Label htmlFor="marks">Marks</Label>
                          <br />
                          <Input
                            id="marks"
                            type="number"
                            min="1"
                            value={newQuestion.marks}
                            onChange={(e) =>
                              setNewQuestion({
                                ...newQuestion,
                                marks: parseInt(e.target.value) || 1,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <Label htmlFor="question-text">Question Content</Label>
                        <br />
                        <Textarea
                          id="question-text"
                          rows={5}
                          value={newQuestion.question_text}
                          onChange={(e) =>
                            setNewQuestion({
                              ...newQuestion,
                              question_text: e.target.value,
                            })
                          }
                        />
                      </div>

                      {renderQuestionOptions()}

                      <div className="flex flex-col">
                        <Label htmlFor="explanation">
                          Explanation (Optional)
                        </Label>
                        <br />
                        <Textarea
                          id="explanation"
                          rows={3}
                          value={newQuestion.explanation || ""}
                          onChange={(e) =>
                            setNewQuestion({
                              ...newQuestion,
                              explanation: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleAddQuestion}>Add Question</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Questions View Toggle */}
            <Tabs
              defaultValue="all"
              onValueChange={(v) => setQuestionsView(v as "all" | "my")}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Questions</TabsTrigger>
                <TabsTrigger value="my">My Questions</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <p className="text-sm text-muted-foreground mb-4">
                  Browse all available questions including officially curated
                  ones and community contributions.
                </p>
              </TabsContent>

              <TabsContent value="my">
                <p className="text-sm text-muted-foreground mb-4">
                  View and manage the questions you've created. You can edit or
                  delete your questions.
                </p>
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle>Question Filter</CardTitle>
                <CardDescription>
                  Find questions based on topics, years, and paper type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch}>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Exam Type
                      </label>
                      <Select value={examType} onValueChange={setExamType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exam type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Prelims">Prelims</SelectItem>
                          <SelectItem value="Mains">Mains</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Year Range
                      </label>
                      <Select value={yearRange} onValueChange={setYearRange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year range" />
                        </SelectTrigger>
                        <SelectContent>
                          {YEAR_RANGES.map((range) => (
                            <SelectItem key={range.label} value={range.label}>
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Subject
                      </label>
                      <Select value={subject} onValueChange={setSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Subjects" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Subjects</SelectItem>
                          {subjects.map((subj) => (
                            <SelectItem key={subj} value={subj}>
                              {subj}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Question Type
                      </label>
                      <Select
                        value={questionType}
                        onValueChange={setQuestionType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Question Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            All Question Types
                          </SelectItem>
                          {QUESTION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-sm font-medium mb-1 block">
                      Topic Keywords (Optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="E.g. Constitution, Environment, Fiscal Policy"
                      className="w-full rounded-md border p-2"
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                    />
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <label className="text-sm font-medium">Sort By:</label>
                      <Select
                        value={sortBy}
                        onValueChange={(value: any) => setSortBy(value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="year">Year</SelectItem>
                          <SelectItem value="subject">Subject</SelectItem>
                          <SelectItem value="exam_type">Exam Type</SelectItem>
                          <SelectItem value="question_type">
                            Question Type
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={sortOrder}
                        onValueChange={(value: any) => setSortOrder(value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Order" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Ascending</SelectItem>
                          <SelectItem value="desc">Descending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit">Search Questions</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>
                  {loading
                    ? "Loading questions..."
                    : `Found ${totalQuestions} questions matching your criteria`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={examType.toLowerCase()}>
                  <TabsList className="mb-4">
                    <TabsTrigger
                      value="prelims"
                      onClick={() => setExamType("Prelims")}
                    >
                      Prelims
                    </TabsTrigger>
                    <TabsTrigger
                      value="mains"
                      onClick={() => setExamType("Mains")}
                    >
                      Mains
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="prelims"
                    className="space-y-4 max-h-[700px] overflow-y-auto"
                  >
                    {loading ? (
                      <div className="flex justify-center p-8">
                        <p>Loading questions...</p>
                      </div>
                    ) : questions.length === 0 ? (
                      <div className="text-center p-8">
                        <p>No questions found matching your criteria.</p>
                      </div>
                    ) : (
                      questions
                        .filter((q) => q.exam_type === "Prelims")
                        .map((question) => (
                          <div
                            key={question.id}
                            className="rounded-md border p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-lg">
                                  {question.question_text}
                                </h3>
                                <div className="flex items-center flex-wrap gap-2 my-2">
                                  <span className="bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded-full">
                                    {question.subject}
                                  </span>
                                  <span className="bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded-full">
                                    {question.year}
                                  </span>
                                  {question.is_database_question ? (
                                    <span className="bg-purple-100 text-purple-700 text-xs py-1 px-2 rounded-full">
                                      Database Question
                                    </span>
                                  ) : (
                                    <span className="bg-green-100 text-green-700 text-xs py-1 px-2 rounded-full">
                                      User Question
                                    </span>
                                  )}
                                  {question.keywords.map((keyword, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-gray-100 text-gray-700 text-xs py-1 px-2 rounded-full"
                                    >
                                      {keyword}
                                    </span>
                                  ))}
                                </div>

                                {renderQuestionContent(question)}
                              </div>
                              {renderQuestionActions(question)}
                            </div>

                            {renderAnswerSection(question)}

                            {modelAnswer &&
                              selectedQuestion?.id === question.id && (
                                <div className="mt-4 p-4 bg-muted/30 rounded-md">
                                  <h4 className="font-medium mb-2">
                                    Model Answer:
                                  </h4>
                                  <p className="text-sm whitespace-pre-wrap">
                                    {modelAnswer}
                                  </p>
                                </div>
                              )}
                            {/* 
                            {question.explanation && (
                              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                                <h4 className="font-medium mb-2">
                                  Explanation:
                                </h4>
                                <p className="text-sm">
                                  {question.explanation}
                                </p>
                              </div>
                            )} */}
                          </div>
                        ))
                    )}
                  </TabsContent>

                  <TabsContent
                    value="mains"
                    className="space-y-4 max-h-[700px] overflow-y-auto"
                  >
                    {loading ? (
                      <div className="flex justify-center p-8">
                        <p>Loading questions...</p>
                      </div>
                    ) : questions.length === 0 ? (
                      <div className="text-center p-8">
                        <p>No questions found matching your criteria.</p>
                      </div>
                    ) : (
                      questions
                        .filter((q) => q.exam_type === "Mains")
                        .map((question) => (
                          <div
                            key={question.id}
                            className="rounded-md border p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-lg">
                                  {question.question_text}
                                </h3>
                                <div className="flex items-center flex-wrap gap-2 my-2">
                                  <span className="bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded-full">
                                    {question.subject}
                                  </span>
                                  <span className="bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded-full">
                                    {question.year}
                                  </span>
                                  {question.is_database_question ? (
                                    <span className="bg-purple-100 text-purple-700 text-xs py-1 px-2 rounded-full">
                                      Database Question
                                    </span>
                                  ) : (
                                    <span className="bg-green-100 text-green-700 text-xs py-1 px-2 rounded-full">
                                      User Question
                                    </span>
                                  )}
                                  {question.keywords.map((keyword, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-gray-100 text-gray-700 text-xs py-1 px-2 rounded-full"
                                    >
                                      {keyword}
                                    </span>
                                  ))}
                                </div>

                                {renderQuestionContent(question)}
                              </div>
                              {renderQuestionActions(question)}
                            </div>

                            {renderAnswerSection(question)}

                            {modelAnswer &&
                              selectedQuestion?.id === question.id && (
                                <div className="mt-4 p-4 bg-muted/30 rounded-md">
                                  <h4 className="font-medium mb-2">
                                    Model Answer:
                                  </h4>
                                  <p className="text-sm whitespace-pre-wrap">
                                    {modelAnswer}
                                  </p>
                                </div>
                              )}

                            {question.explanation && (
                              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                                <h4 className="font-medium mb-2">
                                  Explanation:
                                </h4>
                                <p className="text-sm">
                                  {question.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 ">
              <Card>
                <CardHeader>
                  <CardTitle>Topic Analysis</CardTitle>
                  <CardDescription>
                    Recurring themes in previous years
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto">
                  {analysisLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">
                        Analyzing topics...
                      </p>
                    </div>
                  ) : topicAnalysis.topics.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">
                        No topics to analyze. Try adjusting your filters.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Top Topics</h4>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={topicAnalysis.topics}
                              margin={{
                                top: 10,
                                right: 30,
                                left: 40,
                                bottom: 20,
                              }}
                              barSize={30}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" hide={true} />
                              <YAxis
                                tick={{ fontSize: 11 }}
                                label={{
                                  value: "Count",
                                  angle: -90,
                                  position: "insideLeft",
                                  style: { fontSize: 11 },
                                }}
                              />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-white p-3 border rounded shadow">
                                        <p className="font-medium text-base mb-1">
                                          {payload[0].payload.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          Questions: {payload[0].value}
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar
                                dataKey="count"
                                fill="#8884d8"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Subject Distribution
                        </h4>
                        <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={topicAnalysis.subjectDistribution}
                                dataKey="count"
                                nameKey="subject"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ subject, percent }) =>
                                  percent > 0.05
                                    ? `${subject} (${(percent * 100).toFixed(
                                        0
                                      )}%)`
                                    : ""
                                }
                              >
                                {topicAnalysis.subjectDistribution.map(
                                  (entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={`hsl(${index * 45}, 70%, 50%)`}
                                    />
                                  )
                                )}
                              </Pie>
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-white p-2 border rounded shadow">
                                        <p className="font-medium">
                                          {payload[0].name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          Questions: {payload[0].value}
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Question Patterns</CardTitle>
                  <CardDescription>
                    How question styles have evolved
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto">
                  {analysisLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">
                        Analyzing patterns...
                      </p>
                    </div>
                  ) : questionPattern.questionTypes.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">
                        No patterns to analyze. Try adjusting your filters.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Year-wise Trend
                        </h4>
                        <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={questionPattern.yearTrend}
                              margin={{
                                top: 10,
                                right: 30,
                                left: 40,
                                bottom: 20,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="year"
                                tick={{ fontSize: 11 }}
                                label={{
                                  value: "Year",
                                  position: "insideBottom",
                                  offset: -5,
                                  style: { fontSize: 11 },
                                }}
                              />
                              <YAxis
                                tick={{ fontSize: 11 }}
                                label={{
                                  value: "Number of Questions",
                                  angle: -90,
                                  position: "insideLeft",
                                  style: { fontSize: 11 },
                                }}
                              />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-white p-2 border rounded shadow">
                                        <p className="font-medium">
                                          Year: {payload[0].payload.year}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          Questions: {payload[0].value}
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#8884d8"
                                activeDot={{ r: 8 }}
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Question Type Distribution
                        </h4>
                        <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={questionPattern.questionTypes}
                              margin={{
                                top: 10,
                                right: 30,
                                left: 40,
                                bottom: 60,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="type"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                interval={0}
                                tick={{ fontSize: 11 }}
                                tickMargin={10}
                              />
                              <YAxis
                                tick={{ fontSize: 11 }}
                                label={{
                                  value: "Count",
                                  angle: -90,
                                  position: "insideLeft",
                                  style: { fontSize: 11 },
                                }}
                              />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-white p-2 border rounded shadow">
                                        <p className="font-medium">
                                          {payload[0].payload.type}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          Count: {payload[0].value}
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="count" fill="#82ca9d" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
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
