
import { ArrowRight, BarChart3, Briefcase, LineChart, Users } from "lucide-react";
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
            <span className="bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent">With AI-Powered Matching</span>
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
              {/* Dashboard Background - Enhanced for light mode visibility */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-teal-500/20 dark:bg-gradient-to-br dark:from-green-500/20 dark:to-teal-500/20 border border-green-500/20 dark:border-white/10"></div>
              <div className="absolute inset-0 backdrop-blur-sm bg-white/70 dark:bg-black/30 shadow-lg">
                <div className="relative h-full w-full flex flex-col items-center p-8">
                  {/* Browser-like Top Bar */}
                  <div className="absolute top-4 left-4 right-4 flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="w-full h-8 rounded-md bg-gray-200/80 dark:bg-white/10 flex items-center justify-center">
                      <span className="text-xs text-gray-500 dark:text-gray-300">investor.dashboard.ai</span>
                    </div>
                  </div>
                  
                  {/* Dashboard Top Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12">
                    <div className="bg-white dark:bg-white/10 shadow-sm rounded-lg p-4 h-32 border border-gray-100 dark:border-white/5">
                      <div className="flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-gray-500 dark:text-gray-300 text-xs font-medium">WATCHLIST</span>
                          <BarChart3 size={18} className="text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">24</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-300">Startups you're following</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-white/10 shadow-sm rounded-lg p-4 h-32 border border-gray-100 dark:border-white/5" style={{ animationDelay: "300ms" }}>
                      <div className="flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-gray-500 dark:text-gray-300 text-xs font-medium">MATCHES</span>
                          <Users size={18} className="text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">12</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-300">New high-match startups</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-white/10 shadow-sm rounded-lg p-4 h-32 border border-gray-100 dark:border-white/5" style={{ animationDelay: "600ms" }}>
                      <div className="flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-gray-500 dark:text-gray-300 text-xs font-medium">TRENDING</span>
                          <LineChart size={18} className="text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">AI Health</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-300">Hottest sector this week</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Featured Startup Profile */}
                  <div className="mt-8 grid grid-cols-2 gap-6 w-full">
                    <div className="bg-white dark:bg-white/10 rounded-lg p-4 h-48 border border-gray-100 dark:border-white/5">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Briefcase size={16} className="text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 dark:text-white text-sm">MedAI Solutions</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-300">Kenya · Series A</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                          AI-powered diagnostic solutions for underserved regions. Expanding healthcare access with mobile-first approach.
                        </p>
                        <div className="flex gap-2 mt-auto">
                          <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full">Healthcare</span>
                          <span className="text-xs bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-1 rounded-full">AI</span>
                          <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">Mobile</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-white/10 rounded-lg p-4 h-48 border border-gray-100 dark:border-white/5">
                      <div className="h-full flex flex-col justify-center items-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 dark:bg-green-500/30 flex items-center justify-center">
                          <span className="text-2xl font-bold text-green-600 dark:text-white">85%</span>
                        </div>
                        <span className="text-gray-700 dark:text-white/70 text-sm font-medium">Match Score</span>
                        <Button variant="outline" size="sm" className="text-xs border-green-600 text-green-600 hover:bg-green-500/10 mt-2">
                          View Details <ArrowRight size={12} className="ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <span className="absolute bottom-4 text-gray-400 dark:text-white/40 text-xs">AI-powered dashboard preview</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
