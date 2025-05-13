import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import NewsArticleFetcher from "@/components/NewsArticleFetcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const News = () => {
  const { user } = useAuth();
  const [showNewArticleDialog, setShowNewArticleDialog] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                News & Articles
              </h2>
              <p className="text-muted-foreground mt-2">
                Stay updated with the latest news and articles
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-12">
              <Card className="md:col-span-8">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Article Analyzer</CardTitle>
                  <Button
                    onClick={() => setShowNewArticleDialog(true)}
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Article
                  </Button>
                </CardHeader>
                <CardContent>
                  <NewsArticleFetcher />
                </CardContent>
              </Card>

              <Card className="md:col-span-4">
                <CardHeader>
                  <CardTitle>Recent Articles</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="saved">Saved</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="space-y-4">
                      {/* Add your recent articles list here */}
                      <p className="text-sm text-muted-foreground">
                        No recent articles found.
                      </p>
                    </TabsContent>
                    <TabsContent value="saved" className="space-y-4">
                      {/* Add your saved articles list here */}
                      <p className="text-sm text-muted-foreground">
                        No saved articles found.
                      </p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default News;
