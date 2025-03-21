
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="section-padding pt-32 md:pt-40 overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center rounded-full border border-border/60 bg-background px-3 py-1 text-sm font-medium text-foreground/80 mb-6 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-accent mr-2"></span>
            Revolutionizing startup and investor connections
          </span>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight animate-slide-up" style={{ animationDelay: "100ms" }}>
            <span className="block">Connect Startups and Investors</span>
            <span className="bg-gradient-to-r from-accent to-purple-500 bg-clip-text text-transparent">With AI-Powered Matching</span>
          </h1>
          
          <p className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl animate-slide-up" style={{ animationDelay: "200ms" }}>
            From emerging markets to established hubs, we're leveling the playing field
            with intelligent matchmaking that connects visionary startups to the right investors.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <Button asChild className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-white">
              <Link to="/auth?type=startup">
                Join as Startup
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto border-accent text-accent hover:bg-accent/10">
              <Link to="/auth?type=investor">
                Join as Investor
              </Link>
            </Button>
          </div>
          
          <div className="mt-24 max-w-5xl w-full">
            <div className="relative w-full h-[350px] sm:h-[450px] md:h-[500px] rounded-2xl overflow-hidden animate-scale-in">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-purple-500/20"></div>
              <div className="absolute inset-0 backdrop-blur-sm glass-card">
                <div className="relative h-full w-full flex flex-col items-center justify-center p-8">
                  <div className="absolute top-4 left-4 right-4 flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="w-full h-8 rounded-md bg-white/10"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12">
                    <div className="bg-white/10 rounded-lg p-4 h-32 animate-pulse"></div>
                    <div className="bg-white/10 rounded-lg p-4 h-32 animate-pulse" style={{ animationDelay: "300ms" }}></div>
                    <div className="bg-white/10 rounded-lg p-4 h-32 animate-pulse" style={{ animationDelay: "600ms" }}></div>
                  </div>
                  
                  <div className="mt-8 grid grid-cols-2 gap-6 w-full">
                    <div className="bg-white/10 rounded-lg p-4 h-48"></div>
                    <div className="bg-white/10 rounded-lg p-4 h-48">
                      <div className="h-full flex flex-col justify-center items-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-accent/30 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">85%</span>
                        </div>
                        <span className="text-white/70">Match Score</span>
                      </div>
                    </div>
                  </div>
                  
                  <span className="absolute bottom-4 text-white/40 text-xs">AI-powered dashboard preview</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
