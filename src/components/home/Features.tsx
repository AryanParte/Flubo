
import { Search, MessageSquare, Sparkles, Globe, ChartBar, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <div className={cn(
      "glass-card rounded-xl p-6 transition-all duration-300 hover:translate-y-[-5px] group",
      className
    )}>
      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-5 transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

export function Features() {
  return (
    <section className="section-padding" id="features">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Intelligent Matchmaking</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our platform leverages AI to create meaningful connections between startups and investors,
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
        </div>
      </div>
    </section>
  );
}
