
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

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

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
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

    Please evaluate the essay on the following parameters and provide a score out of 10 for each:
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
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert UPSC essay evaluator with decades of experience.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    const result = await response.json();
    const feedbackText = result.choices[0].message.content;
    
    // Parse the JSON response from the AI
    let feedback;
    try {
      // Extract JSON from the response text (handles case where AI might add extra text)
      const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract JSON from response");
      }
    } catch (error) {
      console.error("Error parsing AI response as JSON:", error);
      console.log("Original response:", feedbackText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse feedback result", 
          rawResponse: feedbackText 
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
