
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

interface EmailVerificationSuccessProps {
  email: string;
  onBackToSignIn: () => void;
}

export function EmailVerificationSuccess({ email, onBackToSignIn }: EmailVerificationSuccessProps) {
  return (
    <>
      <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-700 dark:text-green-400">
          We've sent a confirmation email to {email}. Please check your inbox and click the link to verify your account.
        </AlertDescription>
      </Alert>
      
      <div className="mt-8 space-y-4">
        <Button
          onClick={onBackToSignIn}
          variant="outline"
          className="w-full"
        >
          Back to sign in
        </Button>
      </div>
    </>
  );
}
