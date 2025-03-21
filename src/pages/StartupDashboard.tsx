
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Bell, Users, MessageSquare, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const StartupDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Simulated data
  const stats = [
    { label: "Profile Views", value: 158, trend: "up", percent: 12 },
    { label: "Investor Matches", value: 24, trend: "up", percent: 8 },
    { label: "Messages", value: 7, trend: "down", percent: 3 },
    { label: "Completion", value: "75%", trend: "neutral", percent: 0 },
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Startup Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back, TechNova</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <button className="relative p-2 rounded-full bg-background border border-border/60 text-muted-foreground hover:text-foreground transition-colors">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-accent"></span>
              </button>
              
              <button className="flex items-center space-x-2 py-2 px-4 rounded-md bg-secondary text-secondary-foreground text-sm">
                <span>Complete Your Profile</span>
              </button>
            </div>
          </div>
          
          {/* Dashboard Tabs */}
          <div className="border-b border-border/60 mb-8">
            <div className="flex overflow-x-auto pb-1">
              {[
                { id: "overview", label: "Overview", icon: <BarChart3 size={16} /> },
                { id: "matches", label: "Investor Matches", icon: <Users size={16} /> },
                { id: "messages", label: "Messages", icon: <MessageSquare size={16} /> },
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
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="glass-card p-6 rounded-lg animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  <div className="flex items-center mt-3">
                    <span 
                      className={cn(
                        "text-xs font-medium",
                        stat.trend === "up" ? "text-green-500" : 
                        stat.trend === "down" ? "text-red-500" : 
                        "text-muted-foreground"
                      )}
                    >
                      {stat.trend === "up" ? "↑" : stat.trend === "down" ? "↓" : "–"} 
                      {stat.percent > 0 && `${stat.percent}%`}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">vs. last month</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Investor Matches */}
              <div className="lg:col-span-2 glass-card rounded-lg p-6 animate-fade-in" style={{ animationDelay: "400ms" }}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-medium">Recent Investor Matches</h2>
                  <button className="text-sm text-accent">View All</button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { name: "Blue Venture Capital", score: 92, region: "North America", focus: "AI & Machine Learning" },
                    { name: "Global Impact Fund", score: 87, region: "Europe", focus: "Sustainability" },
                    { name: "Tech Accelerator Group", score: 84, region: "Asia", focus: "SaaS" },
                  ].map((investor, index) => (
                    <div key={index} className="flex items-center p-3 rounded-md bg-background/50 border border-border/40 transition-transform hover:translate-x-1">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent mr-4">
                        {investor.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{investor.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{investor.region} • {investor.focus}</p>
                      </div>
                      <div className="bg-accent/10 text-accent text-xs font-medium rounded-full px-2.5 py-1 flex items-center">
                        {investor.score}% Match
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Profile Completion */}
              <div className="glass-card rounded-lg p-6 animate-fade-in" style={{ animationDelay: "500ms" }}>
                <h2 className="font-medium mb-6">Complete Your Profile</h2>
                
                <div className="space-y-4">
                  {[
                    { task: "Add company details", completed: true },
                    { task: "Upload pitch deck", completed: true },
                    { task: "Connect team members", completed: false },
                    { task: "Add product information", completed: true },
                    { task: "Set funding requirements", completed: false },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className={cn(
                          "w-5 h-5 rounded-full mr-3 flex items-center justify-center",
                          item.completed ? "bg-accent text-white" : "bg-secondary border border-border"
                        )}
                      >
                        {item.completed && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span 
                        className={cn(
                          "text-sm",
                          item.completed ? "text-muted-foreground line-through" : "text-foreground"
                        )}
                      >
                        {item.task}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-accent w-[60%]"></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">3 of 5 tasks completed</p>
                </div>
                
                <button className="w-full mt-6 py-2 rounded-md bg-accent text-accent-foreground text-sm font-medium">
                  Continue Setup
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StartupDashboard;
