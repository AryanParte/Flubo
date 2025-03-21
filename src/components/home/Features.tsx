
import { Search, MessageSquare, Sparkles, Globe, ChartBar, Shield, Zap, Clock, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  style?: React.CSSProperties;
}

function FeatureCard({ icon, title, description, className, style }: FeatureCardProps) {
  return (
    <Card 
      className={cn(
        "border-0 shadow-md bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm dark:from-black/5 dark:to-black/10 transition-all duration-300 hover:translate-y-[-5px] group overflow-hidden",
        className
      )}
      style={style}
    >
      <CardContent className="p-6">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 mb-5 transition-transform duration-300 group-hover:scale-110">
            {icon}
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2 filter blur-xl"></div>
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

export function Features() {
  return (
    <section className="section-padding overflow-hidden relative" id="features">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-green-500/5 to-background pointer-events-none"></div>
      <div className="container mx-auto max-w-6xl relative">
        <div className="text-center mb-16">
          <span className="text-green-600 font-medium">PLATFORM FEATURES</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 mt-2">AI-Powered Matchmaking</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our platform leverages artificial intelligence to create meaningful connections between startups and investors,
            saving time and increasing the chances of successful partnerships.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Search size={24} />}
            title="Natural Language Search"
            description="Search for startups using conversational queries that understand your specific investment interests."
            className="animate-fade-in"
            style={{ animationDelay: "100ms" }}
          />
          
          <FeatureCard
            icon={<MessageSquare size={24} />}
            title="AI Chatbot Simulation"
            description="Startups can test their pitch with an AI that simulates investor questioning patterns."
            className="animate-fade-in"
            style={{ animationDelay: "200ms" }}
          />
          
          <FeatureCard
            icon={<Sparkles size={24} />}
            title="Smart Match Scoring"
            description="Our algorithm generates match scores based on comprehensive data analysis and interactions."
            className="animate-fade-in"
            style={{ animationDelay: "300ms" }}
          />
          
          <FeatureCard
            icon={<Globe size={24} />}
            title="Global Reach"
            description="Discover opportunities from emerging markets and underrepresented regions worldwide."
            className="animate-fade-in"
            style={{ animationDelay: "400ms" }}
          />
          
          <FeatureCard
            icon={<ChartBar size={24} />}
            title="Interactive Dashboards"
            description="Track startup performance metrics and investment trends with intuitive visualizations."
            className="animate-fade-in"
            style={{ animationDelay: "500ms" }}
          />
          
          <FeatureCard
            icon={<Shield size={24} />}
            title="Mutual Interest Protection"
            description="Communication is only enabled when both parties express interest, respecting everyone's time."
            className="animate-fade-in"
            style={{ animationDelay: "600ms" }}
          />

          <FeatureCard
            icon={<Zap size={24} />}
            title="Fast Decision Making"
            description="Get insights and analytics that help you make investment decisions quickly and confidently."
            className="animate-fade-in"
            style={{ animationDelay: "700ms" }}
          />
          
          <FeatureCard
            icon={<Clock size={24} />}
            title="Time-Saving Automation"
            description="Automate the discovery process so you can focus on the startups that matter most to you."
            className="animate-fade-in"
            style={{ animationDelay: "800ms" }}
          />
          
          <FeatureCard
            icon={<Target size={24} />}
            title="Precision Targeting"
            description="Find exactly the right investors for your startup's specific stage, sector, and vision."
            className="animate-fade-in"
            style={{ animationDelay: "900ms" }}
          />
        </div>
      </div>
    </section>
  );
}
