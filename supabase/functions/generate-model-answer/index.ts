
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
    const { topic, question } = await req.json();

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!topic || !question) {
      return new Response(
        JSON.stringify({ error: "Topic and question are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
              "You are an expert UPSC coach who creates model answers for UPSC aspirants.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    const result = await response.json();
    const modelAnswer = result.choices[0].message.content;

    console.log("Successfully generated model answer");

    return new Response(JSON.stringify({ modelAnswer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-model-answer function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
