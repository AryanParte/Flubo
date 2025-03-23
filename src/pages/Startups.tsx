
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
  Rocket, 
  TrendingUp, 
  Users, 
  Banknote,
  Calendar, 
  LightbulbIcon, 
  Target, 
  ArrowRight 
} from "lucide-react";

export default function Startups() {
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
                  <BreadcrumbLink>Startups</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
        
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-background to-background/80">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">For Startups</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Connect with investors who believe in your vision and can provide the capital you need to scale your business.
              </p>
              <Link to="/auth">
                <Button size="lg" className="font-medium">
                  Create Your Startup Profile <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">How Flubo Works for Startups</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg shadow-sm border border-border/50">
                <div className="p-2 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Rocket size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Create Your Profile</h3>
                <p className="text-muted-foreground">Build a comprehensive profile that showcases your startup's vision, team, traction, and funding needs.</p>
              </div>
              
              <div className="bg-background p-6 rounded-lg shadow-sm border border-border/50">
                <div className="p-2 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Target size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Get Matched</h3>
                <p className="text-muted-foreground">Our algorithm matches you with investors who align with your industry, stage, and funding requirements.</p>
              </div>
              
              <div className="bg-background p-6 rounded-lg shadow-sm border border-border/50">
                <div className="p-2 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Banknote size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Secure Funding</h3>
                <p className="text-muted-foreground">Connect directly with interested investors, pitch your vision, and secure the capital you need to grow.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Benefits for Startups</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start">
                <div className="mt-1 p-2 rounded-full bg-accent/10 text-accent mr-4">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Targeted Exposure</h3>
                  <p className="text-muted-foreground">Get your startup in front of investors who are specifically interested in your industry and stage.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mt-1 p-2 rounded-full bg-accent/10 text-accent mr-4">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Network Growth</h3>
                  <p className="text-muted-foreground">Build relationships with experienced investors who can provide mentorship and industry connections.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mt-1 p-2 rounded-full bg-accent/10 text-accent mr-4">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Time Efficiency</h3>
                  <p className="text-muted-foreground">Save time by focusing on investors most likely to fund your venture, rather than cold outreach.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mt-1 p-2 rounded-full bg-accent/10 text-accent mr-4">
                  <LightbulbIcon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Expert Guidance</h3>
                  <p className="text-muted-foreground">Access resources and guidance to help you navigate the fundraising process effectively.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-accent/10">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Ready to Grow Your Startup?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of founders who have successfully connected with investors and secured funding through our platform.
            </p>
            <Link to="/auth">
              <Button size="lg" className="font-medium">
                Get Started Today
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
