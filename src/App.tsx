import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import AuthGuard from "@/components/auth/AuthGuard";
import Index from "./pages/Index";
import Planner from "./pages/Planner";
import News from "./pages/News";
import Questions from "./pages/Questions";
import Essay from "./pages/Essay";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Resources from "./pages/Resources";
import UploadQuestions from "./pages/UploadQuestions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <AuthGuard>
                  <Index />
                </AuthGuard>
              }
            />
            <Route
              path="/planner"
              element={
                <AuthGuard>
                  <Planner />
                </AuthGuard>
              }
            />
            <Route
              path="/news"
              element={
                <AuthGuard>
                  <News />
                </AuthGuard>
              }
            />
            <Route
              path="/questions"
              element={
                <AuthGuard>
                  <Questions />
                </AuthGuard>
              }
            />
            <Route
              path="/questions/upload"
              element={
                <AuthGuard>
                  <UploadQuestions />
                </AuthGuard>
              }
            />
            <Route
              path="/essay"
              element={
                <AuthGuard>
                  <Essay />
                </AuthGuard>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              }
            />
            <Route
              path="/resources"
              element={
                <AuthGuard>
                  <Resources />
                </AuthGuard>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
