import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const { topic, essayType, mode = "framework" } = await req.json();

    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured");
    }

    if (!topic) {
      return new Response(
        JSON.stringify({
          error: "Topic is required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const frameworkPrompt = `
As an expert UPSC essay writer, generate a detailed framework for an essay on the following topic:

Topic: ${topic}
Essay Type: ${essayType || "General"}

Provide a structured outline that includes:
1. A suggested title
2. Main arguments and points to cover
3. Key examples and case studies to include
4. Connections to UPSC syllabus themes
5. Writing tips specific to this topic

Respond ONLY with a valid raw JSON object in this format:
{
  "framework": {
    "title": "Suggested essay title",
    "mainPoints": [
      {
        "heading": "Point heading",
        "subPoints": ["Sub-point 1", "Sub-point 2"],
        "examples": ["Example 1", "Example 2"]
      }
    ],
    "suggestedStructure": {
      "introduction": "Key points to cover in introduction",
      "bodyParagraphs": ["Para 1 focus", "Para 2 focus", "Para 3 focus"],
      "conclusion": "Key points to cover in conclusion"
    },
    "connections": ["Connection to GS Paper 1", "Connection to Ethics", ...],
    "examples": ["Example 1", "Example 2", ...],
    "tips": ["Writing tip 1", "Writing tip 2", ...]
  }
}`;

    const completeEssayPrompt = `
As an expert UPSC essay writer, generate a complete essay on the following topic:

Topic: ${topic}
Essay Type: ${essayType || "General"}

The essay should:
1. Have a clear and engaging introduction that sets the context
2. Present multiple perspectives and dimensions of the topic
3. Include relevant examples, case studies, and data points
4. Demonstrate critical analysis and balanced viewpoints
5. Connect ideas to UPSC syllabus themes (governance, society, ethics, etc.)
6. Have a strong conclusion that ties everything together
7. Follow proper structure with paragraphs and transitions
8. Be around 1000-1200 words

Respond ONLY with a valid raw JSON object in this format:
{
  "essay": {
    "title": "The essay title",
    "introduction": "Introduction paragraph",
    "body": [
      {
        "heading": "First major point",
        "content": "Paragraph content",
        "examples": ["Example 1", "Example 2"]
      }
    ],
    "conclusion": "Conclusion paragraph"
  }
}`;

    const prompt = mode === "framework" ? frameworkPrompt : completeEssayPrompt;

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    });

    if (!geminiRes.ok) {
      throw new Error(
        `Gemini API error: ${geminiRes.status} ${geminiRes.statusText}`
      );
    }

    const result = await geminiRes.json();
    const responseText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("Invalid response format from Gemini API");
    }

    // Parse the JSON response
    let responseData;
    try {
      const text = responseText.trim();
      // Try extracting from ```json ... ``` first
      let rawJson = text;
      const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
      if (jsonBlockMatch) {
        rawJson = jsonBlockMatch[1];
      } else {
        const firstBrace = text.indexOf("{");
        const lastBrace = text.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          rawJson = text.slice(firstBrace, lastBrace + 1);
        } else {
          throw new Error("No valid JSON structure found in Gemini response");
        }
      }
      responseData = JSON.parse(rawJson);
    } catch (error) {
      console.error("Error parsing response:", error);
      console.log("Original Gemini Response:\n", responseText);
      throw new Error(`Failed to parse generated ${mode}`);
    }

    return new Response(JSON.stringify(responseData), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({
        error: err.message || "Unknown error occurred",
        details: err.stack,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
