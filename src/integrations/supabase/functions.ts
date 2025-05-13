import { supabase } from "./client";

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
