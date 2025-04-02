
import { cn } from "@/lib/utils";

type UserType = "startup" | "investor";

interface UserTypeSelectorProps {
  userType: UserType;
  setUserType: (type: UserType) => void;
}

export function UserTypeSelector({ userType, setUserType }: UserTypeSelectorProps) {
  return (
    <div className="bg-background/50 p-1 rounded-lg border border-border mb-6">
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => setUserType("startup")}
          className={cn(
            "py-2.5 px-4 text-sm font-medium rounded-md transition-all",
            userType === "startup"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Business
        </button>
        <button
          type="button"
          onClick={() => setUserType("investor")}
          className={cn(
            "py-2.5 px-4 text-sm font-medium rounded-md transition-all",
            userType === "investor"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Investor
        </button>
      </div>
    </div>
  );
}
