import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Share2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { saveArticle } from "@/integrations/supabase/functions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface ArticleData {
  title: string;
  content: string;
  summary: string;
  author: string;
  date: string;
  source: string;
  url: string;
  category: string;
  tags: string[];
  keyPoints: string[];
  categories: string[];
}

const CATEGORIES = [
  "Politics",
  "Economy",
  "Environment",
  "Science & Technology",
  "International Relations",
  "Society & Culture",
  "Education",
  "Health",
  "Sports",
  "Entertainment",
];

const NewsArticleFetcher = () => {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [category, setCategory] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetchArticle = async () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setArticle(null);

      // Call Supabase Edge Function directly
      const { data, error } = await supabase.functions.invoke(
        "analyze-article",
        {
          body: { url },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data || !data.success || !data.data) {
        throw new Error("Invalid response from article analyzer");
      }

      const articleData = data.data;
      if (!articleData.title || !articleData.content) {
        throw new Error("Invalid article data received");
      }

      setArticle({
        ...articleData,
        category: articleData.categories?.[0] || "",
        tags: articleData.tags || [],
      });
      setCategory(articleData.categories?.[0] || "");
      setTags((articleData.tags || []).join(", "));
      setSummary(articleData.summary || "");
      toast.success("Article analyzed successfully");
    } catch (error: any) {
      console.error("Error analyzing article:", error);
      setError(error.message || "Failed to analyze article. Please try again.");
      toast.error(
        error.message || "Failed to analyze article. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArticle = async () => {
    if (!article || !user) {
      toast.error("Please analyze an article first");
      return;
    }

    if (!category) {
      toast.error("Please select a category");
      return;
    }

    try {
      setLoading(true);
      const processedTags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const articleData = {
        title: article.title,
        content: article.content,
        summary: summary || article.content.substring(0, 200) + "...",
        author: article.author || "",
        published_date: article.date || new Date().toISOString(),
        source: article.source || "",
        url: url,
        category,
        tags: processedTags,
        user_id: user.id,
      };

      console.log("Saving article with data:", articleData);

      await saveArticle(articleData);

      toast.success("Article saved successfully");
      setArticle(null);
      setUrl("");
      setCategory("");
      setTags("");
      setSummary("");
    } catch (error) {
      console.error("Error saving article:", error);
      toast.error("Failed to save article. Please try again.");
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
                if (e.key === "Enter" && !loading) fetchArticle();
              }}
              disabled={loading}
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {article && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{article.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  {article.author && <span>By {article.author}</span>}
                  {article.date && <span>• {article.date}</span>}
                  {article.source && <span>• {article.source}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveArticle}
                  disabled={loading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Category
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tags (comma-separated)
                </label>
                <Input
                  placeholder="e.g. UPSC, Current Affairs, Environment"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Summary</label>
              <Textarea
                placeholder="Enter a brief summary of the article..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
              />
            </div>

            {article.keyPoints && article.keyPoints.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Key Points</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {article.keyPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="prose prose-sm max-w-none">
              {article.content.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>

            {(article.tags || []).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NewsArticleFetcher;
