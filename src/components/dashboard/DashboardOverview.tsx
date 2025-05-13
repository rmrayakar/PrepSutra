
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

const DashboardOverview = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <WelcomeBanner />
      
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Your UPSC preparation at a glance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Study Planner</CardTitle>
            <CardDescription>Today's study schedule</CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <p className="text-sm">Go to your personalized study planner to view and manage your study schedule.</p>
            ) : (
              <p className="text-sm">Sign in to access your personalized study planner.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>News Summarizer</CardTitle>
            <CardDescription>Latest current affairs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Get AI-powered summaries of the latest news relevant to UPSC preparation.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>PYQ Analyzer</CardTitle>
            <CardDescription>Previous year questions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Analyze patterns and trends from previous year UPSC questions.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Essay Builder</CardTitle>
            <CardDescription>Improve your writing</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Get AI feedback on your essay writing and improve your scores.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Performance Tracker</CardTitle>
            <CardDescription>Monitor your progress</CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <p className="text-sm">Track your study progress and performance across subjects.</p>
            ) : (
              <p className="text-sm">Sign in to track your study progress and performance.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Resources</CardTitle>
            <CardDescription>Study materials</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Access curated study resources and materials for UPSC preparation.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
