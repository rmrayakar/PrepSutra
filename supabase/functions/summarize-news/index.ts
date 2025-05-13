
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
    const { articleContent, articleUrl } = await req.json();

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!articleContent && !articleUrl) {
      return new Response(
        JSON.stringify({ error: "Article content or URL is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let content = articleContent;

    // If URL is provided but not content, attempt to fetch the article
    if (articleUrl && !articleContent) {
      try {
        const response = await fetch(articleUrl);
        content = await response.text();
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch article from URL" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    const prompt = `
    Analyze the following news article for UPSC preparation:

    ${content}

    Please provide:
    1. A concise summary (150 words)
    2. Classification of which UPSC GS Paper(s) it belongs to (I-IV)
    3. Key topics/categories for this article
    4. 3 possible UPSC questions that could be asked based on this content
    5. Important points to remember for the UPSC exam

    Format your response as JSON with the following structure:
    {
      "summary": "concise summary here",
      "gsPaper": "Paper I/II/III/IV",
      "categories": ["category1", "category2", "category3"],
      "possibleQuestions": ["question1", "question2", "question3"],
      "keyPoints": ["point1", "point2", "point3", "point4", "point5"]
    }
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert UPSC educator specializing in current affairs analysis.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
      }),
    });

    const result = await response.json();
    const analysisText = result.choices[0].message.content;
    
    // Parse the JSON response from the AI
    let analysis;
    try {
      // Extract JSON from the response text (handles case where AI might add extra text)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract JSON from response");
      }
    } catch (error) {
      console.error("Error parsing AI response as JSON:", error);
      console.log("Original response:", analysisText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse analysis result", 
          rawResponse: analysisText 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Successfully summarized news article");

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in summarize-news function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
