import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  FileSearch,
  FileText,
  Newspaper,
  Search,
  BookMarked,
  Clock,
  Star,
} from "lucide-react";
import UserMenu from "@/components/layout/UserMenu";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";

// Navigation items that will appear in search
const navigationItems = [
  {
    title: "Study Planner",
    icon: BookOpen,
    path: "/planner",
    description: "Create and manage your study schedule",
  },
  {
    title: "News Summarizer",
    icon: Newspaper,
    path: "/news",
    description: "Get summaries of current affairs",
  },
  {
    title: "PYQ Analyzer",
    icon: FileSearch,
    path: "/questions",
    description: "Analyze previous year questions",
  },
  {
    title: "Essay Builder",
    icon: FileText,
    path: "/essay",
    description: "Build structured essays for civil services",
  },
];

// Sample content items that would be searched
const contentItems = [
  {
    title: "Indian Economy Overview",
    icon: BookMarked,
    path: "/content/economy/overview",
    category: "Economics",
  },
  {
    title: "Constitutional Framework",
    icon: BookMarked,
    path: "/content/polity/constitution",
    category: "Polity",
  },
  {
    title: "Environmental Conservation",
    icon: BookMarked,
    path: "/content/environment/conservation",
    category: "Environment",
  },
  {
    title: "Modern Indian History",
    icon: BookMarked,
    path: "/content/history/modern",
    category: "History",
  },
];

// Recent searches
const recentSearches = [
  {
    title: "GST Structure",
    icon: Clock,
    path: "/content/economy/gst",
  },
  {
    title: "Article 370",
    icon: Clock,
    path: "/content/polity/article-370",
  },
];

// Recommended topics
const recommendedTopics = [
  {
    title: "Current Affairs: G20 Summit",
    icon: Star,
    path: "/news/g20",
  },
  {
    title: "UPSC Interview Questions",
    icon: Star,
    path: "/questions/interview",
  },
];

const Header = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Navigation handler
  const runCommand = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  // Handle dialog open state change
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    // Reset search query when dialog closes
    if (!open) {
      setSearchQuery("");
    }
  };

  // Filter content based on search query
  const filteredContent = contentItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6 lg:px-8">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/icon.png"
                alt="PrepSutra Logo"
                className="h-6 w-6 text-prepsutra-primary"
              />
              <span className="font-heading text-xl font-bold">PrepSutra</span>
            </Link>
          </div>

          <div className="flex-1">
            <nav className="hidden md:flex gap-6 ml-12">
              <Link
                to="/planner"
                className="text-sm font-medium transition-all duration-200 hover:text-prepsutra-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-prepsutra-primary after:transition-all after:duration-200 hover:after:w-full"
              >
                Study Planner
              </Link>
              <Link
                to="/news"
                className="text-sm font-medium transition-all duration-200 hover:text-prepsutra-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-prepsutra-primary after:transition-all after:duration-200 hover:after:w-full"
              >
                News Summarizer
              </Link>
              <Link
                to="/questions"
                className="text-sm font-medium transition-all duration-200 hover:text-prepsutra-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-prepsutra-primary after:transition-all after:duration-200 hover:after:w-full"
              >
                PYQ Analyzer
              </Link>
              <Link
                to="/essay"
                className="text-sm font-medium transition-all duration-200 hover:text-prepsutra-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-prepsutra-primary after:transition-all after:duration-200 hover:after:w-full"
              >
                Essay Builder
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(true)}
              className="relative"
            >
              <Search className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Search</span>
              {/* <kbd className="pointer-events-none absolute right-[-30px] top-[50%] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex translate-y-[-50%]">
                <span className="text-xs">⌘</span>K
              </kbd> */}
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <CommandInput
          placeholder="Search for anything..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            No results found. Try a different search term.
          </CommandEmpty>

          {!searchQuery && (
            <>
              <CommandGroup heading="Navigation">
                {navigationItems.map((item) => (
                  <CommandItem
                    key={item.path}
                    onSelect={() => runCommand(item.path)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                    <CommandShortcut className="ml-auto text-xs text-gray-400">
                      {item.description}
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="Recent Searches">
                {recentSearches.map((item) => (
                  <CommandItem
                    key={item.path}
                    onSelect={() => runCommand(item.path)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="Recommended">
                {recommendedTopics.map((item) => (
                  <CommandItem
                    key={item.path}
                    onSelect={() => runCommand(item.path)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {searchQuery && (
            <>
              <CommandGroup heading="Search Results">
                {filteredContent.map((item) => (
                  <CommandItem
                    key={item.path}
                    onSelect={() => runCommand(item.path)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                    <CommandShortcut className="ml-auto text-xs text-gray-400">
                      {item.category}
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="Quick Actions">
                <CommandItem
                  onSelect={() =>
                    runCommand(`/search?q=${encodeURIComponent(searchQuery)}`)
                  }
                >
                  <Search className="mr-2 h-4 w-4" />
                  <span>Search for "{searchQuery}" across all content</span>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    runCommand(
                      `/questions?q=${encodeURIComponent(searchQuery)}`
                    )
                  }
                >
                  <FileSearch className="mr-2 h-4 w-4" />
                  <span>Find PYQs related to "{searchQuery}"</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default Header;
