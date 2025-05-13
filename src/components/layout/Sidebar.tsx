import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Calendar,
  FileSearch,
  FileText,
  Newspaper,
  User,
} from "lucide-react";

const sidebarItems = [
  {
    title: "Dashboard",
    icon: BookOpen,
    path: "/",
  },
  {
    title: "Study Planner",
    icon: Calendar,
    path: "/planner",
  },
  {
    title: "News Summarizer",
    icon: Newspaper,
    path: "/news",
  },
  {
    title: "PYQ Analyzer",
    icon: FileSearch,
    path: "/questions",
  },
  {
    title: "Essay Builder",
    icon: FileText,
    path: "/essay",
  },
  {
    title: "Profile",
    icon: User,
    path: "/profile",
  },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-sidebar p-6">
      <div className="flex items-center gap-2 mb-8">
        <img src="icon.png" className="h-6 w-6 text-prepsutra-primary" />
        <span className="font-heading text-lg font-bold">PrepSutra</span>
      </div>

      <nav className="flex flex-col gap-2">
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-prepsutra-primary text-white"
                  : "hover:bg-prepsutra-light/20 hover:text-prepsutra-primary"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h5 className="font-semibold mb-2">Need help?</h5>
          <p className="text-sm text-muted-foreground">
            Contact our support team for assistance.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
