/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // needed for fetch polyfill in Deno
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const body = await req.json();
    const { topic, question } = body;
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured");
    }
    if (!topic || !question) {
      return new Response(JSON.stringify({
        error: "Topic and question are required"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const prompt = `
As an expert UPSC coach, provide a comprehensive model answer for the following UPSC question:

Topic: ${topic}
Question: ${question}

Your answer should:
1. Have a clear introduction that frames the issue
2. Include relevant facts, data points, and historical context
3. Present multiple perspectives on the issue
4. Incorporate case studies or real-world examples
5. Conclude with a balanced viewpoint
6. Follow UPSC answer writing best practices (structure, precision, balance)
7. Be around 250-300 words (Mains standard)

If this is an MCQ question, respond with just the correct option letter (A, B, C, or D) followed by a brief explanation.
`;
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });
    const resultText = await geminiRes.text();
    if (!geminiRes.ok) {
      console.error("Gemini API error:", resultText);
      throw new Error(`Gemini API error: ${geminiRes.status} ${geminiRes.statusText}`);
    }
    const result = JSON.parse(resultText);
    const modelAnswer = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!modelAnswer) {
      throw new Error("Invalid response format from Gemini API");
    }
    const cleanAnswer = modelAnswer.replace(/\*\*/g, "").replace(/^#+\s*/gm, "").trim();
    return new Response(JSON.stringify({
      modelAnswer: cleanAnswer
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({
      error: err.message || "Unknown error occurred",
      details: err.stack
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
