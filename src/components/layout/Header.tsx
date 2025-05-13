import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Search } from "lucide-react";
import UserMenu from "@/components/layout/UserMenu";

const Header = () => {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="flex items-center space-x-2">
            <img src="icon.png" className="h-6 w-6 text-prepsutra-primary" />
            <span className="font-heading text-xl font-bold">PrepSutra</span>
          </Link>
        </div>

        <div className="flex-1">
          <nav className="hidden md:flex gap-6 ml-6">
            <Link
              to="/planner"
              className="text-sm font-medium transition-colors hover:text-prepsutra-primary"
            >
              Study Planner
            </Link>
            <Link
              to="/news"
              className="text-sm font-medium transition-colors hover:text-prepsutra-primary"
            >
              News Summarizer
            </Link>
            <Link
              to="/questions"
              className="text-sm font-medium transition-colors hover:text-prepsutra-primary"
            >
              PYQ Analyzer
            </Link>
            <Link
              to="/essay"
              className="text-sm font-medium transition-colors hover:text-prepsutra-primary"
            >
              Essay Builder
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Search className="h-[1.2rem] w-[1.2rem]" />
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
