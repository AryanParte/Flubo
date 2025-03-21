
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-9 w-16 items-center justify-center rounded-full transition-colors duration-300",
        theme === "dark" ? "bg-secondary" : "bg-secondary/50",
        className
      )}
      aria-label="Toggle theme"
    >
      <span
        className={cn(
          "absolute flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300",
          theme === "dark"
            ? "left-[calc(100%-2rem)] translate-x-1 bg-background text-accent"
            : "left-1 bg-white text-primary"
        )}
      >
        {theme === "dark" ? (
          <Moon size={16} className="transition-transform duration-300" />
        ) : (
          <Sun size={16} className="transition-transform duration-300" />
        )}
      </span>
    </button>
  );
}
