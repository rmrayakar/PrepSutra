import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }
  let url;
  try {
    const body = await req.json();
    url = body.url;
    if (!url) throw new Error("URL is required");
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Invalid JSON body or missing URL",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") || "");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });
    // Fetch HTML content from URL
    const response = await fetch(url);
    const html = await response.text();
    // Prepare prompt for Gemini
    const prompt = `Analyze this HTML content and extract the following information in JSON format:
1. title: The main title of the article
2. content: The main content of the article, properly formatted with paragraphs
3. author: The author's name if available
4. date: The publication date if available
5. source: The source website name
6. summary: A brief summary of the article (2-3 sentences)
7. keyPoints: An array of 3-5 key points from the article
8. categories: An array of relevant categories (e.g., Politics, Economy, etc.)
9. tags: An array of relevant tags for the article

HTML Content:
${html}

Return only the JSON object, no additional text.`;
    // Get Gemini result
    const result = await model.generateContent(prompt);
    const response_text = await result.response.text();
    // Remove Markdown formatting if present
    const cleaned = response_text.trim().replace(/^```json\s*|```$/g, "");
    const articleData = JSON.parse(cleaned);
    // Basic validation
    if (!articleData.title || !articleData.content) {
      throw new Error("Failed to extract essential article data");
    }
    // Store in Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data, error } = await supabaseClient
      .from("analyzed_articles")
      .insert([
        {
          url,
          title: articleData.title,
          content: articleData.content,
          author: articleData.author,
          published_date: articleData.date,
          source: articleData.source,
          summary: articleData.summary,
          key_points: articleData.keyPoints,
          categories: articleData.categories,
          tags: articleData.tags,
          analysis_status: "completed",
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return new Response(
      JSON.stringify({
        success: true,
        data: articleData,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
});
