
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup";

interface AuthModeSelectorProps {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  emailSent: boolean;
}

export function AuthModeSelector({ authMode, setAuthMode, emailSent }: AuthModeSelectorProps) {
  if (emailSent) return null;
  
  return (
    <div className="mt-6 text-center text-sm">
      <span className="text-muted-foreground">
        {authMode === "signin" ? "Don't have an account? " : "Already have an account? "}
      </span>
      <button
        onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
        className="text-accent hover:underline"
      >
        {authMode === "signin" ? "Sign up" : "Sign in"}
      </button>
    </div>
  );
}
