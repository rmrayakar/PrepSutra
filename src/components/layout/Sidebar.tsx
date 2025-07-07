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
  HelpCircle,
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
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { sendHelpMessage } from "@/integrations/supabase/functions";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (user) {
      // Fetch profile from Supabase
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        if (!error && data) {
          setProfile({ full_name: data.full_name || "" });
          setContactForm((prev) => ({
            ...prev,
            name: data.full_name || "",
            email: user.email || "",
          }));
        } else {
          setProfile(null);
          setContactForm((prev) => ({
            ...prev,
            name: "",
            email: user.email || "",
          }));
        }
      };
      fetchProfile();
    } else {
      setProfile(null);
      setContactForm((prev) => ({ ...prev, name: "", email: "" }));
    }
  }, [user]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendHelpMessage(
        contactForm.name,
        contactForm.email,
        contactForm.subject,
        contactForm.message
      );
      toast({
        title: "Message Sent!",
        description:
          "Your request has been received. Our team will get back to you soon.",
      });
      setContactForm({
        name: user?.user_metadata?.full_name || "",
        email: user?.email || "",
        subject: "",
        message: "",
      });
      setIsContactOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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

        {/* Navigation (scrollable) */}
        <nav className="flex flex-col gap-2 px-3 flex-1 min-h-0 overflow-y-auto">
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
      </aside>

      {/* Fixed Need Help Button */}
      <button
        className="fixed z-50 bottom-6 right-6 bg-prepsutra-primary text-white rounded-full shadow-lg p-3 flex items-center gap-2 hover:bg-prepsutra-secondary focus:outline-none focus:ring-2 focus:ring-prepsutra-primary focus:ring-offset-2"
        aria-label="Open Help Dialog"
        onClick={() => setIsHelpOpen(true)}
        type="button"
      >
        <HelpCircle className="h-6 w-6" />
        <span className="hidden md:inline font-semibold">Need Help?</span>
      </button>

      {/* Help Modal Dialog */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent
          className="max-w-lg w-full max-h-[90vh] overflow-y-auto"
          aria-label="Help and Support Dialog"
        >
          <DialogHeader>
            <DialogTitle>Need Help?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-3">
            We're here to help! Reach out anytime, or check our quick FAQ below.
          </p>
          <Accordion type="single" collapsible className="mb-3">
            <AccordionItem value="faq1">
              <AccordionTrigger>How do I reset my password?</AccordionTrigger>
              <AccordionContent>
                Go to your profile page and click "Change Password". If you
                forgot your password, use the "Forgot Password" link on the
                login page.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq2">
              <AccordionTrigger>How can I contact support?</AccordionTrigger>
              <AccordionContent>
                Use the contact form below, email us at{" "}
                <a href="mailto:rmrayakar2004@gmail.com" className="underline">
                  rmrayakar2004@gmail.com
                </a>
                , or call +91 99649 75545.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq3">
              <AccordionTrigger>
                Where can I find study resources?
              </AccordionTrigger>
              <AccordionContent>
                Visit the{" "}
                <Link
                  to="/resources"
                  className="underline text-prepsutra-primary"
                >
                  Resources
                </Link>{" "}
                page for curated study materials.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <form
            onSubmit={handleContactSubmit}
            className="space-y-4"
            aria-label="Contact Support Form"
          >
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
                autoComplete="name"
                aria-required="true"
                aria-label="Name"
                disabled={!!user}
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
                autoComplete="email"
                aria-required="true"
                aria-label="Email"
                disabled={!!user}
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
                aria-required="true"
                aria-label="Subject"
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
                aria-required="true"
                aria-label="Message"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </form>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground mt-4">
            <a
              href="mailto:rmrayakar2004@gmail.com"
              className="flex items-center gap-2 hover:text-prepsutra-primary transition-colors"
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">rmrayakar2004@gmail.com</span>
            </a>
            <a
              href="tel:+919964975545"
              className="flex items-center gap-2 hover:text-prepsutra-primary transition-colors"
            >
              <Phone className="h-4 w-4 shrink-0" />
              <span className="truncate">+91 99649 75545</span>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Sidebar;
