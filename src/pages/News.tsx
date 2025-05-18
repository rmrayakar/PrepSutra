import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import NewsArticleFetcher from "@/components/NewsArticleFetcher";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Bookmark, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  NewsArticle,
  getArticles,
  getArticleCategories,
  deleteArticle,
} from "@/integrations/supabase/functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const News = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showNewArticleDialog, setShowNewArticleDialog] = useState(false);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [view, setView] = useState<"all" | "saved">("all");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(
    null
  );

  useEffect(() => {
    fetchCategories();
    fetchArticles();
  }, [view, selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const data = await getArticleCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    }
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params: any = {
        limit: 10,
        search: searchQuery || undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        user_id: view === "saved" ? user?.id : undefined,
      };

      const { articles: fetchedArticles } = await getArticles(params);
      setArticles(
        fetchedArticles.map((a: any) => ({
          author: a.author || "",
          category: a.category || "",
          tags: Array.isArray(a.tags)
            ? a.tags
            : typeof a.tags === "string" && a.tags
            ? a.tags.split(",").map((t: string) => t.trim())
            : [],
          user_id: a.user_id || "",
          id: a.id,
          title: a.title,
          content: a.content,
          summary: a.summary,
          source: a.source,
          url: a.url,
          published_date: a.published_date,
          created_at: a.created_at,
          updated_at: a.updated_at,
        }))
      );
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch articles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    try {
      await deleteArticle(articleId);
      toast({
        title: "Success",
        description: "Article deleted successfully",
      });
      fetchArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive",
      });
    }
  };

  const renderArticleCard = (article: NewsArticle) => (
    <div
      key={article.id}
      className="border rounded-lg p-4 space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => setSelectedArticle(article)}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-medium">{article.title}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteArticle(article.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2">
        {article.summary}
      </p>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{article.source}</span>
        <span>•</span>
        <span>{new Date(article.published_date).toLocaleDateString()}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{article.category}</Badge>
        {(Array.isArray(article.tags)
          ? article.tags
          : article.tags
          ? String(article.tags)
              .split(",")
              .map((t) => t.trim())
          : []
        ).map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  News & Articles
                </h2>
                <p className="text-muted-foreground mt-2">
                  Stay updated with the latest news and articles
                </p>
              </div>
              <Button onClick={() => setShowNewArticleDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Article
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-12">
              <Card className="md:col-span-8">
                <CardHeader>
                  <CardTitle>Article Analyzer</CardTitle>
                  <CardDescription>
                    Analyze and extract insights from news articles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NewsArticleFetcher />
                </CardContent>
              </Card>

              <Card className="md:col-span-4">
                <CardHeader>
                  <CardTitle>Recent Articles</CardTitle>
                  <div className="flex gap-2 mt-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs
                    defaultValue="all"
                    value={view}
                    onValueChange={(v) => setView(v as "all" | "saved")}
                  >
                    <TabsList className="mb-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="saved">Saved</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="space-y-4">
                      {loading ? (
                        <div className="flex justify-center p-4">
                          <p className="text-muted-foreground">
                            Loading articles...
                          </p>
                        </div>
                      ) : articles.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center p-4">
                          No articles found.
                        </p>
                      ) : (
                        articles.map(renderArticleCard)
                      )}
                    </TabsContent>
                    <TabsContent value="saved" className="space-y-4">
                      {loading ? (
                        <div className="flex justify-center p-4">
                          <p className="text-muted-foreground">
                            Loading saved articles...
                          </p>
                        </div>
                      ) : articles.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center p-4">
                          No saved articles found.
                        </p>
                      ) : (
                        articles.map(renderArticleCard)
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Article View Dialog */}
          <Dialog
            open={!!selectedArticle}
            onOpenChange={() => setSelectedArticle(null)}
          >
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              {selectedArticle && (
                <>
                  <DialogHeader>
                    <DialogTitle>{selectedArticle.title}</DialogTitle>
                    <DialogDescription>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        {selectedArticle.author && (
                          <span>By {selectedArticle.author}</span>
                        )}
                        <span>•</span>
                        <span>{selectedArticle.source}</span>
                        <span>•</span>
                        <span>
                          {new Date(
                            selectedArticle.published_date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {selectedArticle.category}
                      </Badge>
                      {(Array.isArray(selectedArticle.tags)
                        ? selectedArticle.tags
                        : selectedArticle.tags
                        ? String(selectedArticle.tags)
                            .split(",")
                            .map((t) => t.trim())
                        : []
                      ).map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="prose prose-sm max-w-none">
                      {selectedArticle.content
                        .split("\n")
                        .map((paragraph, index) => (
                          <p key={index} className="mb-4">
                            {paragraph}
                          </p>
                        ))}
                    </div>
                    {selectedArticle.url && (
                      <div className="text-sm text-muted-foreground">
                        <a
                          href={selectedArticle.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          Read original article
                        </a>
                      </div>
                    )}
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default News;
