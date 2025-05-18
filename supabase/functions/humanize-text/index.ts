import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const HUGGINGFACE_API_KEY = Deno.env.get("HUGGINGFACE_API_KEY");
// Using a more suitable model for text humanization
const HUGGINGFACE_API_URL =
  "https://api-inference.huggingface.co/models/facebook/opt-350m";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let inputText = "";

  try {
    // Check for API key
    if (!HUGGINGFACE_API_KEY) {
      throw new Error("HUGGINGFACE_API_KEY is not set");
    }

    const { text } = await req.json();
    inputText = text;

    if (!inputText) {
      throw new Error("Text is required");
    }

    // Prepare the prompt for better humanization
    const prompt = `Rewrite the following text to make it more natural, engaging, and human-like while preserving its core meaning:

Original text: ${inputText}

Humanized version:`;

    // Call Hugging Face API
    const response = await fetch(HUGGINGFACE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 1000,
          temperature: 0.8,
          top_p: 0.95,
          repetition_penalty: 1.2,
          return_full_text: false,
          do_sample: true,
          num_return_sequences: 1,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Hugging Face API error:", errorText);
      throw new Error(
        `Hugging Face API error: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();

    if (!result || !Array.isArray(result) || !result[0]?.generated_text) {
      console.error("Invalid response from Hugging Face:", result);
      throw new Error("Invalid response from Hugging Face API");
    }

    // Clean up the generated text
    let humanizedText = result[0].generated_text
      .replace(/Humanized version:/g, "") // Remove the prompt text
      .replace(/Original text:.*$/g, "") // Remove any remaining prompt text
      .trim();

    // If the text is too short or seems invalid, return the original text
    if (humanizedText.length < inputText.length * 0.5) {
      console.warn("Generated text too short, returning original text");
      humanizedText = inputText;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          humanizedText,
          originalText: inputText,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in humanize-text function:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
        originalText: inputText, // Include original text in error response
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
