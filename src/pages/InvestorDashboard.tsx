
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Bell, Search, ThumbsUp, ThumbsDown, MessageSquare, Filter, Globe, Briefcase, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const InvestorDashboard = () => {
  const [activeTab, setActiveTab] = useState("discover");
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
    // This would normally call the OpenAI API to process the natural language query
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Investor Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back, Alex Morgan</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <button className="relative p-2 rounded-full bg-background border border-border/60 text-muted-foreground hover:text-foreground transition-colors">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-accent"></span>
              </button>
            </div>
          </div>
          
          {/* AI Search */}
          <div className="glass-card rounded-lg p-4 mb-8 animate-fade-in">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search startups using natural language, e.g. 'Series A startup in Africa working on AI for healthcare'"
                className="w-full h-12 pl-11 pr-4 rounded-md bg-background/70 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit" 
                className="absolute right-2 top-2 bg-accent text-accent-foreground px-3 py-2 rounded-md text-sm font-medium"
              >
                Search
              </button>
            </form>
          </div>
          
          {/* Dashboard Tabs */}
          <div className="border-b border-border/60 mb-8">
            <div className="flex overflow-x-auto pb-1">
              {[
                { id: "discover", label: "Discover Startups", icon: <Globe size={16} /> },
                { id: "matches", label: "My Matches", icon: <ThumbsUp size={16} /> },
                { id: "portfolio", label: "Portfolio", icon: <Briefcase size={16} /> },
                { id: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
                { id: "settings", label: "Settings", icon: <Settings size={16} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors",
                    activeTab === tab.id
                      ? "border-accent text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Dashboard Content */}
          <div>
            {/* Filters and Sort */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div className="flex items-center space-x-2 mb-4 sm:mb-0">
                <button className="inline-flex items-center space-x-1 px-3 py-1.5 bg-background border border-border rounded-md text-sm">
                  <Filter size={14} />
                  <span>Filters</span>
                </button>
                
                <div className="flex space-x-2">
                  {["AI & ML", "Fintech", "Africa"].map((filter, index) => (
                    <div key={index} className="flex items-center space-x-1 px-2 py-1 bg-accent/10 text-accent rounded-md text-xs">
                      <span>{filter}</span>
                      <button className="text-accent/70 hover:text-accent">×</button>
                    </div>
                  ))}
                </div>
              </div>
              
              <select className="h-9 px-3 rounded-md border border-input bg-background text-sm">
                <option>Highest Match</option>
                <option>Newest First</option>
                <option>Trending</option>
              </select>
            </div>
            
            {/* Startup Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { 
                  name: "HealthAI Solutions", 
                  score: 94, 
                  stage: "Series A",
                  location: "Nairobi, Kenya",
                  sector: "Healthcare AI",
                  description: "AI-powered diagnostic tools for underserved healthcare markets in Africa.",
                  raised: "$2.5M"
                },
                { 
                  name: "EcoFinance", 
                  score: 87, 
                  stage: "Seed",
                  location: "São Paulo, Brazil",
                  sector: "Fintech",
                  description: "Sustainable microlending platform for small businesses in emerging markets.",
                  raised: "$750K"
                },
                { 
                  name: "AgriTech Global", 
                  score: 82, 
                  stage: "Pre-seed",
                  location: "Bangalore, India",
                  sector: "AgriTech",
                  description: "IoT solutions for smallholder farmers to optimize crop yields and reduce waste.",
                  raised: "$350K"
                },
              ].map((startup, index) => (
                <div 
                  key={index} 
                  className="glass-card rounded-lg overflow-hidden flex flex-col animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="h-32 bg-gradient-to-r from-accent/20 to-accent/5 flex items-center justify-center">
                    <span className="font-medium text-xl">{startup.name.charAt(0)}</span>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold">{startup.name}</h3>
                      <div className="bg-accent/10 text-accent text-xs font-medium rounded-full px-2.5 py-1 flex items-center">
                        {startup.score}% Match
                      </div>
                    </div>
                    
                    <div className="flex items-center text-xs text-muted-foreground mb-4">
                      <span className="pr-2 mr-2 border-r border-border">{startup.stage}</span>
                      <span>{startup.location}</span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">{startup.description}</p>
                    
                    <div className="flex items-center text-xs mb-6">
                      <div className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground mr-2">
                        {startup.sector}
                      </div>
                      <div className="text-muted-foreground">
                        Raised: {startup.raised}
                      </div>
                    </div>
                    
                    <div className="mt-auto flex space-x-2">
                      <button className="flex-1 flex justify-center items-center h-9 rounded-md bg-secondary text-secondary-foreground text-sm">
                        <ThumbsDown size={14} className="mr-1" />
                        <span>Skip</span>
                      </button>
                      <button className="flex-1 flex justify-center items-center h-9 rounded-md bg-accent text-accent-foreground text-sm">
                        <ThumbsUp size={14} className="mr-1" />
                        <span>Interested</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Load More */}
            <div className="mt-8 text-center">
              <button className="inline-flex items-center justify-center h-10 px-6 rounded-md border border-border bg-background hover:bg-secondary transition-colors text-sm font-medium">
                Load More Startups
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InvestorDashboard;
