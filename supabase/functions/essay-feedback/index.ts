import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content } = await req.json();

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: "Essay title and content are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const prompt = `
    As a UPSC essay evaluator, provide detailed feedback on the following essay:

    Title: ${title}
    
    Essay Content:
    ${content}

    Please evaluate the essay on the following parameters and provide a score out of 100 for each:
    1. Introduction and Conclusion
    2. Content and Substance
    3. Structure and Organization
    4. Language and Expression
    5. Examples and Evidence
    6. Multidimensional Approach
    7. Critical Analysis

    For each parameter, provide specific suggestions for improvement.
    
    Also provide an overall score out of 100 and general feedback on the essay's strengths and weaknesses.
    
    Format your response as JSON with the following structure:
    {
      "parameters": {
        "introductionAndConclusion": {
          "score": 0,
          "feedback": "detailed feedback here",
          "suggestions": "improvement suggestions here"
        },
        "contentAndSubstance": {
          "score": 0,
          "feedback": "",
          "suggestions": ""
        },
        "structureAndOrganization": {
          "score": 0,
          "feedback": "",
          "suggestions": ""
        },
        "languageAndExpression": {
          "score": 0,
          "feedback": "",
          "suggestions": ""
        },
        "examplesAndEvidence": {
          "score": 0,
          "feedback": "",
          "suggestions": ""
        },
        "multidimensionalApproach": {
          "score": 0,
          "feedback": "",
          "suggestions": ""
        },
        "criticalAnalysis": {
          "score": 0,
          "feedback": "",
          "suggestions": ""
        }
      },
      "overallScore": 0,
      "generalFeedback": "",
      "strengths": ["", "", ""],
      "weaknesses": ["", "", ""],
      "improvementAreas": ["", "", ""]
    }

    IMPORTANT: Return ONLY the JSON object, no other text.
    `;

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const feedbackText = response.text();

    // Parse the JSON response
    let feedback;
    try {
      // Extract JSON from the response text
      const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract JSON from response");
      }

      // Validate the feedback structure
      if (!feedback.parameters || !feedback.overallScore) {
        throw new Error("Invalid feedback structure");
      }

      // Ensure all scores are numbers between 0 and 100
      Object.values(feedback.parameters).forEach((param: any) => {
        param.score = Math.min(100, Math.max(0, Number(param.score)));
      });
      feedback.overallScore = Math.min(
        100,
        Math.max(0, Number(feedback.overallScore))
      );
    } catch (error) {
      console.error("Error parsing AI response as JSON:", error);
      console.log("Original response:", feedbackText);
      return new Response(
        JSON.stringify({
          error: "Failed to parse feedback result",
          rawResponse: feedbackText,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Successfully generated essay feedback");

    return new Response(JSON.stringify(feedback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in essay-feedback function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
