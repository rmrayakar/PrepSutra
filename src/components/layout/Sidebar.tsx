import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Calendar,
  FileSearch,
  FileText,
  Newspaper,
  User,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";

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
    title: "Resources",
    icon: FolderOpen,
    path: "/resources",
  },
  {
    title: "Profile",
    icon: User,
    path: "/profile",
  },
];

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    return savedState ? JSON.parse(savedState) : false;
  });
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-sidebar relative transition-all duration-300",
        isCollapsed ? "w-24" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <button
        className="absolute -right-3 top-6 bg-sidebar border rounded-full p-1 hover:bg-prepsutra-light/20"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Brand Section */}
      <div
        className={cn(
          "flex items-center gap-2 p-6",
          isCollapsed && "justify-center"
        )}
      >
        <img
          src="icon.png"
          className="h-6 w-6 text-prepsutra-primary"
          alt="icon"
        />
        {!isCollapsed && (
          <span className="font-heading text-lg font-bold">PrepSutra</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 px-3">
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
                  : "hover:bg-prepsutra-light/20 hover:text-prepsutra-primary",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <item.icon className="h-4 w-4" />
              {!isCollapsed && item.title}
            </Link>
          );
        })}
      </nav>

      {/* Help Box */}
      {!isCollapsed && (
        <div className="mt-auto p-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h5 className="font-semibold mb-2">Need help?</h5>
            <p className="text-sm text-muted-foreground">
              Contact our support team for assistance.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
