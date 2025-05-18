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
  MessageSquare,
  Mail,
  Phone,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

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
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Message Sent",
        description: "We'll get back to you soon!",
      });

      setContactForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setIsContactOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-sidebar relative transition-all duration-300 h-[calc(100vh-4rem)]",
        isCollapsed ? "w-16" : "w-52"
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
      ></div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 px-3 flex-1 overflow-y-auto">
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
        <div className="p-4 border-t">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h5 className="font-semibold mb-2">Need help?</h5>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              Contact our support team for assistance.
            </p>
            <div className="space-y-2">
              <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="truncate">Contact Us</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Contact Support</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Name
                      </label>
                      <Input
                        id="name"
                        value={contactForm.name}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            email: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-sm font-medium">
                        Subject
                      </label>
                      <Input
                        id="subject"
                        value={contactForm.subject}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            subject: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium">
                        Message
                      </label>
                      <Textarea
                        id="message"
                        value={contactForm.message}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            message: e.target.value,
                          })
                        }
                        required
                        className="min-h-[100px]"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <a
                  href="mailto:support@prepsutra.com"
                  className="flex items-center gap-2 hover:text-prepsutra-primary transition-colors"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">support@prepsutra.com</span>
                </a>
                <a
                  href="tel:+919964975545"
                  className="flex items-center gap-2 hover:text-prepsutra-primary transition-colors"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  <span className="truncate">+91 99649 75545</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
