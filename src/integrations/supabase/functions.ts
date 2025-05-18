import { supabase } from "./client";
import { TablesInsert } from "./types";

export interface ModelAnswerResponse {
  modelAnswer: string;
}

export interface NewsAnalysisResponse {
  summary: string;
  gsPaper: string;
  categories: string[];
  possibleQuestions: string[];
  keyPoints: string[];
}

export interface EssayFeedbackResponse {
  parameters: {
    introductionAndConclusion: {
      score: number;
      feedback: string;
      suggestions: string;
    };
    contentAndSubstance: {
      score: number;
      feedback: string;
      suggestions: string;
    };
    structureAndOrganization: {
      score: number;
      feedback: string;
      suggestions: string;
    };
    languageAndExpression: {
      score: number;
      feedback: string;
      suggestions: string;
    };
    examplesAndEvidence: {
      score: number;
      feedback: string;
      suggestions: string;
    };
    multidimensionalApproach: {
      score: number;
      feedback: string;
      suggestions: string;
    };
    criticalAnalysis: { score: number; feedback: string; suggestions: string };
  };
  overallScore: number;
  generalFeedback: string;
  strengths: string[];
  weaknesses: string[];
  improvementAreas: string[];
}

export interface EssayFramework {
  framework: {
    title: string;
    mainPoints: Array<{
      heading: string;
      subPoints: string[];
      examples: string[];
    }>;
    suggestedStructure: {
      introduction: string;
      bodyParagraphs: string[];
      conclusion: string;
    };
    connections: string[];
    examples: string[];
    tips: string[];
  };
}

export interface CompleteEssay {
  essay: {
    title: string;
    introduction: string;
    body: Array<{
      heading: string;
      content: string;
      examples: string[];
    }>;
    conclusion: string;
  };
}

export type GeneratedEssayResponse = EssayFramework | CompleteEssay;

export const generateModelAnswer = async (
  topic: string,
  question: string
): Promise<ModelAnswerResponse> => {
  const { data, error } = await supabase.functions.invoke(
    "generate-model-answer",
    {
      body: { topic, question },
    }
  );

  if (error) throw error;
  return data;
};

export const analyzeNewsArticle = async (
  articleContent: string,
  articleUrl?: string
): Promise<NewsAnalysisResponse> => {
  const { data, error } = await supabase.functions.invoke("summarize-news", {
    body: { articleContent, articleUrl },
  });

  if (error) throw error;
  return data;
};

export const getEssayFeedback = async (
  title: string,
  content: string
): Promise<EssayFeedbackResponse> => {
  const { data, error } = await supabase.functions.invoke("essay-feedback", {
    body: { title, content },
  });

  if (error) throw error;
  return data;
};

export const generateEssay = async (
  topic: string,
  essayType?: string,
  mode: "framework" | "complete" = "framework"
): Promise<GeneratedEssayResponse> => {
  const { data, error } = await supabase.functions.invoke("generate-essay", {
    body: { topic, essayType, mode },
  });

  if (error) throw error;
  return data;
};

// Exam Question Function Types
export interface QuestionSearchParams {
  yearStart?: number;
  yearEnd?: number;
  exactYear?: number;
  subject?: string;
  examType?: string;
  keywords?: string[];
  question_type?: string;
  sortBy?: "year" | "subject" | "exam_type" | "question_type";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
  userQuestionsOnly?: boolean; // Flag to get only user's questions
}

export interface QuestionSearchResult {
  questions: any[];
  count: number;
}

export interface AnswerSimilarityResponse {
  similarity_score: number;
  awarded_marks: number;
}

// Add a new exam question
export const addExamQuestion = async (
  questionData: TablesInsert<"exam_questions">
) => {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to add questions");
  }

  // Set user_id and default is_database_question=false for user-created questions
  const questionWithUser = {
    ...questionData,
    user_id: user.id,
    is_database_question: questionData.is_database_question || false,
  };

  const { data, error } = await supabase
    .from("exam_questions")
    .insert(questionWithUser)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get a specific question by ID
export const getExamQuestionById = async (id: string) => {
  const { data, error } = await supabase
    .from("exam_questions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Delete user-created question
export const deleteExamQuestion = async (id: string) => {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to delete questions");
  }

  // Only allow deletion of the user's own questions
  const { error } = await supabase
    .from("exam_questions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("is_database_question", false);

  if (error) throw error;
  return true;
};

// Search and filter questions
export const searchExamQuestions = async (
  params: QuestionSearchParams
): Promise<QuestionSearchResult> => {
  let query = supabase.from("exam_questions").select("*", { count: "exact" });

  // Get current user for filtering
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Filter by user questions only if requested
  if (params.userQuestionsOnly && user) {
    query = query.eq("user_id", user.id);
  } else if (user) {
    // Otherwise, show database questions and user's own questions
    query = query.or(`is_database_question.eq.true,user_id.eq.${user.id}`);
  } else {
    // If not logged in, show only database questions
    query = query.eq("is_database_question", true);
  }

  // Apply other filters
  if (params.exactYear) {
    query = query.eq("year", params.exactYear);
  } else {
    if (params.yearStart) {
      query = query.gte("year", params.yearStart);
    }
    if (params.yearEnd) {
      query = query.lte("year", params.yearEnd);
    }
  }

  if (params.subject) {
    query = query.eq("subject", params.subject);
  }

  if (params.examType) {
    query = query.eq("exam_type", params.examType);
  }

  if (params.question_type) {
    query = query.eq("question_type", params.question_type);
  }

  if (params.keywords && params.keywords.length > 0) {
    // Use Postgres array operators to search for keywords
    query = query.overlaps("keywords", params.keywords);
  }

  // Apply sorting
  if (params.sortBy) {
    const order = params.sortOrder || "asc";
    query = query.order(params.sortBy, { ascending: order === "asc" });
  } else {
    // Default sorting by year (newest first)
    query = query.order("year", { ascending: false });
  }

  // Apply pagination
  if (params.limit) {
    query = query.limit(params.limit);
  }

  if (params.offset) {
    query = query.range(
      params.offset,
      params.offset + (params.limit || 10) - 1
    );
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error searching questions:", error);
    throw error;
  }

  console.log("Search results:", {
    totalCount: count,
    questionsFound: data?.length || 0,
    params,
    isUserLoggedIn: !!user,
  });

  return {
    questions: data || [],
    count: count || 0,
  };
};

// Submit an answer to a question
export const submitAnswer = async (questionId: string, answerText: string) => {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to submit answers");
  }

  // Get the question to compare with the correct answer
  const { data: question, error: questionError } = await supabase
    .from("exam_questions")
    .select("*")
    .eq("id", questionId)
    .single();

  if (questionError) throw questionError;

  let similarity_score = null;
  let awarded_marks = 0;

  try {
    // For MCQ questions, use exact match
    if (question.question_type === "mcq") {
      // Generate model answer for MCQ validation
      const response = await generateModelAnswer(
        question.subject,
        question.question_text
      );
      const modelAnswer = response.modelAnswer.trim().toUpperCase();
      // Check if user's answer matches any of the valid options (A, B, C, D)
      similarity_score = ["A", "B", "C", "D"].includes(
        answerText.trim().toUpperCase()
      )
        ? answerText.trim().toUpperCase() === modelAnswer
          ? 1
          : 0
        : 0;
      awarded_marks = similarity_score * question.marks;
    } else {
      // For descriptive questions, use Gemini API to evaluate
      const response = await generateModelAnswer(
        question.subject,
        question.question_text
      );
      const result = await calculateAnswerScore(
        answerText,
        response.modelAnswer,
        question.marks
      );
      similarity_score = result.similarity_score;
      awarded_marks = result.awarded_marks;
    }

    // Insert or update the answer
    const { data, error } = await supabase
      .from("question_answers")
      .upsert({
        question_id: questionId,
        user_id: user.id,
        answer_text: answerText,
        similarity_score,
        awarded_marks,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error submitting answer:", error);
    throw error;
  }
};

// Get user's answer to a specific question
export const getUserAnswer = async (questionId: string) => {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("question_answers")
    .select("*")
    .eq("question_id", questionId)
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is the "no rows returned" error, which we can ignore
    throw error;
  }

  return data || null;
};

// Calculate similarity score and awarded marks
export const calculateAnswerScore = async (
  userAnswer: string,
  correctAnswer: string,
  maxMarks: number
): Promise<AnswerSimilarityResponse> => {
  try {
    // For descriptive answers, use the OpenAI function to calculate semantic similarity
    if (userAnswer.length > 30 && correctAnswer.length > 30) {
      const { data, error } = await supabase.functions.invoke(
        "calculate-answer-similarity",
        {
          body: { userAnswer, correctAnswer, maxMarks },
        }
      );

      if (error) throw error;
      return data;
    } else {
      // For simple answers, use a simpler matching algorithm
      // Convert to lowercase and remove punctuation
      const processedUserAnswer = userAnswer
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      const processedCorrectAnswer = correctAnswer
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

      // Calculate basic similarity (exact match = 100%, no match = 0%)
      const similarity =
        processedUserAnswer === processedCorrectAnswer ? 1.0 : 0.0;

      // Award marks based on similarity
      const awardedMarks = similarity * maxMarks;

      return {
        similarity_score: similarity,
        awarded_marks: awardedMarks,
      };
    }
  } catch (error) {
    console.error("Error calculating similarity:", error);

    // Return a default score on error
    return {
      similarity_score: 0,
      awarded_marks: 0,
    };
  }
};

// Get all possible subjects (for dropdown filters)
export const getExamSubjects = async () => {
  const { data, error } = await supabase
    .from("exam_questions")
    .select("subject")
    .order("subject");

  if (error) throw error;

  // Get unique subjects
  const subjects = [...new Set(data.map((item) => item.subject))];
  return subjects;
};

// Update an exam question
export const updateExamQuestion = async (
  id: string,
  updates: Partial<TablesInsert<"exam_questions">>
) => {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to update questions");
  }

  const { data, error } = await supabase
    .from("exam_questions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id) // Ensure user can only update their own questions
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Essay Functions
export const saveEssay = async (
  title: string,
  content: string,
  feedback: string | null = null,
  score: number | null = null
) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to save essays");
  }

  const { data, error } = await supabase
    .from("essays")
    .insert({
      title,
      content,
      feedback,
      score,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEssay = async (
  id: string,
  updates: Partial<TablesInsert<"essays">>
) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to update essays");
  }

  const { data, error } = await supabase
    .from("essays")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserEssays = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to get essays");
  }

  const { data, error } = await supabase
    .from("essays")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const getEssayById = async (id: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to get essays");
  }

  const { data, error } = await supabase
    .from("essays")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) throw error;
  return data;
};

export const deleteEssay = async (id: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to delete essays");
  }

  const { error } = await supabase
    .from("essays")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  return true;
};

// News Article Types
export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  author: string;
  source: string;
  url: string;
  published_date: string;
  category: string;
  tags: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

// News Article Functions
export const saveArticle = async (
  article: Omit<NewsArticle, "id" | "created_at" | "updated_at">
) => {
  try {
    const { data, error } = await supabase
      .from("news_articles")
      .insert([article])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error saving article:", error);
    throw error;
  }
};

export const getArticles = async (params: {
  category?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
  user_id?: string;
}) => {
  try {
    let query = supabase.from("news_articles").select("*", { count: "exact" });

    if (params.category) {
      query = query.eq("category", params.category);
    }

    if (params.tags && params.tags.length > 0) {
      query = query.contains("tags", params.tags);
    }

    if (params.search) {
      query = query.or(
        `title.ilike.%${params.search}%,content.ilike.%${params.search}%`
      );
    }

    if (params.user_id) {
      query = query.eq("user_id", params.user_id);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(
        params.offset,
        params.offset + (params.limit || 10) - 1
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { articles: data, count };
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw error;
  }
};

export const getArticleCategories = async () => {
  try {
    const { data, error } = await supabase
      .from("news_articles")
      .select("category", { distinct: true });

    if (error) throw error;
    return data.map((item) => item.category);
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const deleteArticle = async (articleId: string) => {
  try {
    const { error } = await supabase
      .from("news_articles")
      .delete()
      .eq("id", articleId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting article:", error);
    throw error;
  }
};

// Text Humanization Function
export const humanizeText = async (text: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke("humanize-text", {
      body: { text },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    // Return the humanized text from the new response format
    return data.data.humanizedText;
  } catch (error) {
    console.error("Error humanizing text:", error);
    // If there's an error, return the original text
    return text;
  }
};
