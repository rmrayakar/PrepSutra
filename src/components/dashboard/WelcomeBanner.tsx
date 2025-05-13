
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const WelcomeBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-prepsutra-primary/20 to-prepsutra-secondary/20 rounded-lg p-6 mb-6">
      <h1 className="text-2xl font-bold mb-2">
        {user ? `Welcome back${user.email ? ', ' + user.email.split('@')[0] : ''}!` : 'Welcome to PrepSutra!'}
      </h1>
      <p className="text-muted-foreground mb-4">
        {user 
          ? 'Your AI-powered UPSC preparation assistant is ready to help you succeed.'
          : 'Sign in to access personalized AI-powered UPSC preparation tools and resources.'}
      </p>
      {!user && (
        <Button onClick={() => navigate('/auth')}>
          Get Started
        </Button>
      )}
    </div>
  );
};

export default WelcomeBanner;
