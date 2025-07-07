import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Helper function to clean HTML content
function cleanHtmlContent(html: string): string {
  // Remove script and style tags and their content
  let cleaned = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );
  cleaned = cleaned.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    ""
  );

  // Remove common HTML tags but keep their text content
  cleaned = cleaned.replace(/<[^>]*>/g, " ");

  // Remove extra whitespace and normalize
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Limit content length to avoid token limits
  return cleaned.substring(0, 10000);
}

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
    if (!response.ok) {
      throw new Error(
        `Failed to fetch URL: ${response.status} ${response.statusText}`
      );
    }

    const html = await response.text();
    const cleanedContent = cleanHtmlContent(html);

    // Prepare prompt for Gemini
    const prompt = `You are an expert article analyzer. Extract the following information from this web page content and return ONLY a valid JSON object:

{
  "title": "The main title of the article (string)",
  "content": "The main article content, properly formatted with paragraphs (string)",
  "author": "The author's name if available, otherwise empty string (string)",
  "date": "The publication date if available, otherwise empty string (string)",
  "source": "The source website name (string)",
  "summary": "A brief summary of the article in 2-3 sentences (string)",
  "keyPoints": ["key point 1", "key point 2", "key point 3", "key point 4", "key point 5"],
  "categories": ["category1", "category2", "category3"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

IMPORTANT: 
- Return ONLY the JSON object, no additional text, no markdown formatting
- Do not include any HTML tags in the content
- Extract only the actual article text content
- If you cannot find certain information, use empty strings or empty arrays

Web page content:
${cleanedContent}`;

    // Get Gemini result
    const result = await model.generateContent(prompt);
    const response_text = await result.response.text();

    // Clean the response and parse JSON
    let cleaned = response_text.trim();

    // Remove markdown code blocks if present
    cleaned = cleaned.replace(/^```json\s*|```$/g, "");
    cleaned = cleaned.replace(/^```\s*|```$/g, "");

    // Try to extract JSON if there's extra text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    let articleData;
    try {
      articleData = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", cleaned);
      throw new Error("Failed to parse article analysis response");
    }

    // Basic validation
    if (!articleData.title || !articleData.content) {
      throw new Error("Failed to extract essential article data");
    }

    // Ensure all required fields exist
    const validatedData = {
      title: articleData.title || "",
      content: articleData.content || "",
      author: articleData.author || "",
      date: articleData.date || "",
      source: articleData.source || "",
      summary: articleData.summary || "",
      keyPoints: Array.isArray(articleData.keyPoints)
        ? articleData.keyPoints
        : [],
      categories: Array.isArray(articleData.categories)
        ? articleData.categories
        : [],
      tags: Array.isArray(articleData.tags) ? articleData.tags : [],
    };

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
          title: validatedData.title,
          content: validatedData.content,
          author: validatedData.author,
          published_date: validatedData.date,
          source: validatedData.source,
          summary: validatedData.summary,
          key_points: validatedData.keyPoints,
          categories: validatedData.categories,
          tags: validatedData.tags,
          analysis_status: "completed",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        data: validatedData,
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
    console.error("Error in analyze-article:", error);
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
