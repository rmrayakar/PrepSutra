import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const DashboardOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
        <Card
          onClick={() => navigate("/planner")}
          className="cursor-pointer group"
        >
          <CardHeader className="pb-2">
            <CardTitle className="group-hover:text-prepsutra-primary transition-all duration-300 group-hover:scale-105">
              Study Planner
            </CardTitle>
            <CardDescription className="transition-all duration-300 group-hover:translate-x-1">
              Today's study schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <p className="text-sm transition-all duration-300 group-hover:translate-x-1">
                Go to your personalized study planner to view and manage your
                study schedule.
              </p>
            ) : (
              <p className="text-sm transition-all duration-300 group-hover:translate-x-1">
                Sign in to access your personalized study planner.
              </p>
            )}
          </CardContent>
        </Card>

        <Card
          onClick={() => navigate("/news")}
          className="cursor-pointer group hover:border-prepsutra-primary/50 hover:z-10"
        >
          <CardHeader className="pb-2">
            <CardTitle className="group-hover:text-prepsutra-primary transition-all duration-300 group-hover:scale-105">
              News Summarizer
            </CardTitle>
            <CardDescription className="transition-all duration-300 group-hover:translate-x-1">
              Latest current affairs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm transition-all duration-300 group-hover:translate-x-1">
              Get AI-powered summaries of the latest news relevant to UPSC
              preparation.
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => navigate("/questions")}
          className="cursor-pointer group hover:border-prepsutra-primary/50 hover:z-10"
        >
          <CardHeader className="pb-2">
            <CardTitle className="group-hover:text-prepsutra-primary transition-all duration-300 group-hover:scale-105">
              PYQ Analyzer
            </CardTitle>
            <CardDescription className="transition-all duration-300 group-hover:translate-x-1">
              Previous year questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm transition-all duration-300 group-hover:translate-x-1">
              Analyze patterns and trends from previous year UPSC questions.
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => navigate("/essay")}
          className="cursor-pointer group hover:border-prepsutra-primary/50 hover:z-10"
        >
          <CardHeader className="pb-2">
            <CardTitle className="group-hover:text-prepsutra-primary transition-all duration-300 group-hover:scale-105">
              Essay Builder
            </CardTitle>
            <CardDescription className="transition-all duration-300 group-hover:translate-x-1">
              Improve your writing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm transition-all duration-300 group-hover:translate-x-1">
              Get AI feedback on your essay writing and improve your scores.
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => navigate("/tracker")}
          className="cursor-pointer group hover:border-prepsutra-primary/50 hover:z-10"
        >
          <CardHeader className="pb-2">
            <CardTitle className="group-hover:text-prepsutra-primary transition-all duration-300 group-hover:scale-105">
              Performance Tracker
            </CardTitle>
            <CardDescription className="transition-all duration-300 group-hover:translate-x-1">
              Monitor your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <p className="text-sm transition-all duration-300 group-hover:translate-x-1">
                Track your study progress and performance across subjects.
              </p>
            ) : (
              <p className="text-sm transition-all duration-300 group-hover:translate-x-1">
                Sign in to track your study progress and performance.
              </p>
            )}
          </CardContent>
        </Card>

        <Card
          onClick={() => navigate("/resources")}
          className="cursor-pointer group hover:border-prepsutra-primary/50 hover:z-10"
        >
          <CardHeader className="pb-2">
            <CardTitle className="group-hover:text-prepsutra-primary transition-all duration-300 group-hover:scale-105">
              Resources
            </CardTitle>
            <CardDescription className="transition-all duration-300 group-hover:translate-x-1">
              Study materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm transition-all duration-300 group-hover:translate-x-1">
              Access curated study resources and materials for UPSC preparation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
