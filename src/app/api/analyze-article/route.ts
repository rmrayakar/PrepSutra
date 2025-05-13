import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL d" },
        { status: 400 }     )
      }
    // VURL format
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Fetch the article content
    let response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0;"Win64; x64 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
    } catch (e) {
    return NextResponse.json(
        { error: "Failed to fetch article content" },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch article content: ${response.statusText}` },
        { status: response.status }
      );
    }

    let html;
    try {
      html = await response.text();
    } catch (e) {
      return NextResponse.json(
        { error: "Failed to read article content" },
        { status: 500 }
      );
    }

    const $ = cheerio.load(html);

    // Extract basic metadata
    const title = $("title").text() || $("h1").first().text();
    const author = $('meta[name="author"]').attr("content") || "";
    const date = $('meta[property="article:published_time"]').attr("content") || "";

    //Get the main content
    const content = $("article, .article, .post, .content, main")
      .text()
      .trim()
      .replace(/\s+/g, " ");

    if (!content) {
      return NextResponse.json(
        { error: "Could not extract article content" },
        { status: 400 }
      );
    }

    // Use Gemini to analyze and structure the content
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
        Analyze this news article content and extract the following information in a structured format:
        - Main title
        - Author name
        - Publication date
        - Main content (formatted in paragraphs)
        - Source website name

        Article content:
        ${content}

        Please format the response as a JSON object with the following structure:
        {
          "title": "article title",
          "author": "author name",
          "date": "publication date",
          "content": "formatted content with paragraphs",
          "source": "source website name"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      let articleData;
      try {
        articleData = JSON.parse(text);
      } catch (e) {
        return NextResponse.json(
          { error: "Failed to parse AI response" },
          { status: 500 }
        );
      }

      return NextResponse.json(articleData);
    } catch (e) {
      console.error("Gemini AI error:", e);
      return NextResponse.json(
        { error: "Failed to analyze article with AI" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error analyzing article:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
