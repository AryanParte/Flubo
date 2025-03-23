
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
  Handshake, 
  Users, 
  Briefcase, 
  Lightbulb,
  Building, 
  SearchCheck, 
  Rocket, 
  ArrowRight 
} from "lucide-react";

export default function Partnerships() {
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
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink>Partnerships</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
        
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-background to-background/80">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">Design Partners</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Join our partnership program to discover and collaborate with innovative startups, gaining early access to cutting-edge solutions while providing valuable feedback.
              </p>
              <Link to="/auth">
                <Button size="lg" className="font-medium">
                  Become a Design Partner <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">How Partnership Works</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg shadow-sm border border-border/50">
                <div className="p-2 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Building size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Create Your Profile</h3>
                <p className="text-muted-foreground">Build an organizational profile showcasing your company's needs, interests, and areas you want to innovate in.</p>
              </div>
              
              <div className="bg-background p-6 rounded-lg shadow-sm border border-border/50">
                <div className="p-2 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <SearchCheck size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Discover Startups</h3>
                <p className="text-muted-foreground">Browse through our curated list of innovative startups aligned with your organization's strategic goals.</p>
              </div>
              
              <div className="bg-background p-6 rounded-lg shadow-sm border border-border/50">
                <div className="p-2 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Handshake size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Collaborate & Innovate</h3>
                <p className="text-muted-foreground">Partner with selected startups to provide feedback, conduct pilots, and help shape products that address your needs.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Benefits for Design Partners</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start">
                <div className="mt-1 p-2 rounded-full bg-accent/10 text-accent mr-4">
                  <Rocket size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Early Access</h3>
                  <p className="text-muted-foreground">Be among the first to access innovative technologies and solutions before they reach the broader market.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mt-1 p-2 rounded-full bg-accent/10 text-accent mr-4">
                  <Lightbulb size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Influence Product Direction</h3>
                  <p className="text-muted-foreground">Shape product development to ensure solutions address your organization's specific needs and challenges.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mt-1 p-2 rounded-full bg-accent/10 text-accent mr-4">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Competitive Advantage</h3>
                  <p className="text-muted-foreground">Gain a competitive edge by adopting innovative solutions before they become widely available in your industry.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mt-1 p-2 rounded-full bg-accent/10 text-accent mr-4">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Innovation Network</h3>
                  <p className="text-muted-foreground">Connect with a community of forward-thinking companies and entrepreneurs driving innovation across industries.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-accent/10">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Join Our Design Partner Network</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with cutting-edge startups, provide valuable feedback, and gain early access to innovative solutions that can transform your business.
            </p>
            <Link to="/auth">
              <Button size="lg" className="font-medium">
                Apply Now
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
