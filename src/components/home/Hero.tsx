
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="section-padding pt-32 md:pt-40">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center rounded-full border border-border/60 bg-background px-3 py-1 text-sm font-medium text-foreground/80 mb-6 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-accent mr-2"></span>
            Revolutionizing startup and investor connections
          </span>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight animate-slide-up" style={{ animationDelay: "100ms" }}>
            <span className="block">Connect Startups and Investors</span>
            <span className="block text-accent">With AI-Powered Matching</span>
          </h1>
          
          <p className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl animate-slide-up" style={{ animationDelay: "200ms" }}>
            From emerging markets to established hubs, we're leveling the playing field
            with intelligent matchmaking that connects visionary startups to the right investors.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <Link 
              to="/auth?type=startup" 
              className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-md bg-accent text-accent-foreground px-6 font-medium transition-transform hover:scale-105"
            >
              Join as Startup
            </Link>
            <Link 
              to="/auth?type=investor" 
              className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-md bg-secondary text-secondary-foreground px-6 font-medium transition-transform hover:scale-105"
            >
              Join as Investor
            </Link>
          </div>
          
          <div className="mt-24 flex items-center justify-center w-full max-w-5xl">
            <div className="w-full h-[350px] sm:h-[450px] md:h-[500px] rounded-2xl overflow-hidden glass-card animate-scale-in">
              <div className="w-full h-full bg-gradient-to-br from-background/50 to-muted/30 flex items-center justify-center">
                <span className="text-muted-foreground">
                  Dashboard Preview
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
