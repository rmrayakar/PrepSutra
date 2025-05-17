import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke("analyze-article", {
      body: { url },
    });

    if (error) {
      console.error("Supabase Edge Function error:", error);
      return res.status(500).json({ error: error.message });
    }

    // The Edge Function returns { success: true, data: articleData }
    if (!data || !data.success || !data.data) {
      console.error("Invalid response from Edge Function:", data);
      return res
        .status(500)
        .json({ error: "Invalid response from article analyzer" });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Error in analyze-article API:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to analyze article" });
  }
}
