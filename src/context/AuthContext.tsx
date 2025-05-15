import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle specific auth events
      if (event === "SIGNED_IN") {
        console.log("Successfully signed in!");
      } else if (event === "SIGNED_OUT") {
        toast.info("You have been signed out");
      } else if (event === "USER_UPDATED") {
        toast.success("Profile updated successfully");
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data: authData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        console.error("Sign in error:", signInError);
        throw signInError;
      }

      // Check if profile exists
      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        // If no profile exists or there was an error, create a new profile
        if (!profile || profileError) {
          const { error: createError } = await supabase
            .from("profiles")
            .insert({
              id: authData.user.id,
              email: email,
              full_name: "",
              username: email.split("@")[0],
              avatar_url: "",
              created_at: new Date().toISOString(),
              study_plan_count: 0,
              notes_count: 0,
              quiz_count: 0,
            });

          if (createError) {
            console.error("Error creating profile:", createError);
            throw createError;
          }
        }
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // First, check if there's any existing profile for this email
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking existing user:", checkError);
        throw checkError;
      }

      if (existingUser) {
        // Delete the existing profile if found
        const { error: deleteError } = await supabase
          .from("profiles")
          .delete()
          .eq("id", existingUser.id);

        if (deleteError) {
          console.error("Error deleting existing profile:", deleteError);
          throw deleteError;
        }
      }

      // Create new user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        }
      );

      if (signUpError) {
        console.error("Sign up error:", signUpError);
        throw signUpError;
      }

      // Create new profile
      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          email: email,
          full_name: "",
          avatar_url: "",
          created_at: new Date().toISOString(),
          study_plan_count: 0,
          notes_count: 0,
          quiz_count: 0,
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error("Error creating profile:", profileError);
          throw profileError;
        }
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        throw error;
      }
    } catch (error: any) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
