
import { Hero } from "@/components/home/Hero";
import { Features } from "@/components/home/Features";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Rocket, Users } from "lucide-react";

const StatCard = ({ number, label, icon, delay }: { number: string; label: string; icon: React.ReactNode; delay: string }) => (
  <div 
    className="flex flex-col items-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 animate-fade-in"
    style={{ animationDelay: delay }}
  >
    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4">
      {icon}
    </div>
    <h3 className="text-3xl font-bold mb-1">{number}</h3>
    <p className="text-muted-foreground text-sm">{label}</p>
  </div>
);

const CTASection = () => (
  <section className="section-padding relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/5 to-background pointer-events-none"></div>
    <div className="container mx-auto max-w-6xl relative">
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-accent to-purple-600 p-1">
        <div className="bg-card/95 backdrop-blur-md rounded-xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to transform your investment strategy?</h2>
              <p className="text-muted-foreground mb-6">
                Join thousands of startups and investors already using our platform to make smarter, 
                faster connections in the global innovation ecosystem.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-accent hover:bg-accent/90">
                  <Link to="/auth?type=startup">
                    Join as Startup <ArrowRight size={16} className="ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-accent text-accent hover:bg-accent/10">
                  <Link to="/auth?type=investor">
                    Join as Investor
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="w-48 h-48 bg-gradient-to-br from-accent/30 to-purple-500/30 rounded-full flex items-center justify-center">
                <div className="w-36 h-36 bg-gradient-to-br from-accent/50 to-purple-500/50 rounded-full flex items-center justify-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-accent to-purple-500 rounded-full flex items-center justify-center text-white">
                    <Rocket size={36} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const StatsSection = () => (
  <section className="section-padding">
    <div className="container mx-auto max-w-6xl">
      <div className="text-center mb-16">
        <span className="text-accent font-medium">PLATFORM STATS</span>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 mt-2">Growing Global Ecosystem</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Join our thriving community of innovators and investors from around the world
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          number="5,000+" 
          label="Startups Onboarded"
          icon={<Rocket size={24} />}
          delay="100ms"
        />
        <StatCard 
          number="1,200+" 
          label="Active Investors"
          icon={<Users size={24} />}
          delay="200ms"
        />
        <StatCard 
          number="$120M+" 
          label="Funding Facilitated"
          icon={<BarChart3 size={24} />}
          delay="300ms"
        />
      </div>
    </div>
  </section>
);

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <StatsSection />
        <Features />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
