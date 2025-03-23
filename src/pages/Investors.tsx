
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { 
  Search, 
  Filter, 
  Briefcase, 
  Zap, 
  Gem, 
  BarChart, 
  ShieldCheck, 
  ArrowRight 
} from "lucide-react";

export default function Investors() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 pt-20">
        {/* Breadcrumb */}
        <div className="border-b border-border/40">
          <div className="container py-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink as={Link} to="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink>Investors</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
        
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-background to-background/80">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">For Investors</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover promising startups aligned with your investment criteria and build a diverse portfolio of high-potential ventures.
              </p>
              <Link to="/auth">
                <Button size="lg" className="font-medium">
                  Join Our Investor Network <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">How Flubo Works for Investors</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg shadow-sm border border-border/50">
                <div className="p-2 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Briefcase size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Set Your Criteria</h3>
                <p className="text-muted-foreground">Define your investment preferences, including industries, stages, and check size to receive tailored startup recommendations.</p>
              </div>
              
              <div className="bg-background p-6 rounded-lg shadow-sm border border-border/50">
                <div className="p-2 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Search size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Discover Startups</h3>
                <p className="text-muted-foreground">Browse through a curated list of startups that match your investment criteria and interests.</p>
              </div>
              
              <div className="bg-background p-6 rounded-lg shadow-sm border border-border/50">
                <div className="p-2 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Filter size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Connect & Invest</h3>
                <p className="text-muted-foreground">Reach out to promising founders, conduct due diligence, and build your investment portfolio.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Benefits for Investors</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start">
                <div className="mt-1 p-2 rounded-full bg-accent/10 text-accent mr-4">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Quality Deal Flow</h3>
                  <p className="text-muted-foreground">Access a steady stream of vetted startups that match your specific investment criteria and preferences.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mt-1 p-2 rounded-full bg-accent/10 text-accent mr-4">
                  <Gem size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Early Access</h3>
                  <p className="text-muted-foreground">Discover promising startups before they gain widespread attention, potentially securing better investment terms.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mt-1 p-2 rounded-full bg-accent/10 text-accent mr-4">
                  <BarChart size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Portfolio Management</h3>
                  <p className="text-muted-foreground">Track and manage your startup investments efficiently through our comprehensive dashboard.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mt-1 p-2 rounded-full bg-accent/10 text-accent mr-4">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Verified Information</h3>
                  <p className="text-muted-foreground">Make informed decisions with verified startup information, including traction metrics and team backgrounds.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-accent/10">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Join Our Investor Network Today</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with innovative startups, expand your investment portfolio, and be part of the next generation of successful ventures.
            </p>
            <Link to="/auth">
              <Button size="lg" className="font-medium">
                Create Investor Account
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
