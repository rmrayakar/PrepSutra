import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ArticleData {
  title: string;
  content: string;
  author: string;
  date: string;
  source: string;
}

const NewsArticleFetcher = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<ArticleData | null>(null);

  const fetchArticle = async () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    try {
      setLoading(true);
      setArticle(null); // Clear previous article

      const response = await fetch("/api/analyze-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      let data;
      try {
          const text = await response.text();
  console.log("Raw response:", text); // See what's returned
  data = JSON.parse(text);
      } catch (e) {
        throw new Error("Failed to parse server response");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch article");
      }

      // Validate the response data
      if (!data.title || !data.content) {
        throw new Error("Invalid article data received");
      }

      setArticle(data);
      toast.success("Article analyzed successfully");
    } catch (error: any) {
      console.error("Error fetching article:", error);
      toast.error(
        error.message || "Failed to analyze article. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>News Article Analyzer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter news article URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  fetchArticle();
                }
              }}
            />
            <Button onClick={fetchArticle} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Article"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {article && (
        <Card>
          <CardHeader>
            <CardTitle>{article.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {article.author && <span>By {article.author}</span>}
              {article.date && <span>• {article.date}</span>}
              {article.source && <span>• {article.source}</span>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {article.content.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NewsArticleFetcher;
