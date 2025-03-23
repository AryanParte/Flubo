
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
  Globe, 
  Target, 
  Award,
  Users, 
  MessageSquare, 
  Mail, 
  ArrowRight 
} from "lucide-react";

export default function About() {
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
                  <BreadcrumbLink>About</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
        
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-background to-background/80">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">About Flubo</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Bridging the gap between innovative startups and visionary investors to create a thriving ecosystem of growth and opportunity.
              </p>
            </div>
          </div>
        </section>
        
        {/* Our Story Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-6">Our Story</h2>
                <p className="text-muted-foreground mb-4">
                  Flubo was founded in 2023 with a simple mission: to democratize access to capital for innovative startups and provide investors with a streamlined way to discover promising ventures.
                </p>
                <p className="text-muted-foreground mb-4">
                  Our founders, experienced entrepreneurs and investors themselves, recognized the inefficiencies in the traditional fundraising process. Startups spent countless hours pitching to investors who weren't aligned with their vision, while investors waded through hundreds of pitches to find the few that matched their investment thesis.
                </p>
                <p className="text-muted-foreground">
                  Through our intelligent matching platform, we're transforming how startups and investors connect, making the process more efficient, transparent, and successful for everyone involved.
                </p>
              </div>
              <div className="bg-muted/30 p-6 rounded-lg">
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="p-2 mt-1 rounded-full bg-primary/10 text-primary mr-4">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Our Mission</h3>
                      <p className="text-muted-foreground">To create a more efficient and accessible fundraising ecosystem that empowers startups and investors alike.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="p-2 mt-1 rounded-full bg-primary/10 text-primary mr-4">
                      <Target size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Our Vision</h3>
                      <p className="text-muted-foreground">To become the world's leading platform for startup-investor connections, driving innovation and economic growth globally.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="p-2 mt-1 rounded-full bg-primary/10 text-primary mr-4">
                      <Award size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Our Values</h3>
                      <p className="text-muted-foreground">Transparency, innovation, inclusivity, and impact guide everything we do at Flubo.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Team Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Our Team</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg shadow-sm border border-border/50 text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users size={32} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-1">Alex Johnson</h3>
                <p className="text-sm text-muted-foreground mb-3">Co-Founder & CEO</p>
                <p className="text-sm text-muted-foreground">
                  Former startup founder with multiple successful exits. Passionate about helping entrepreneurs access the resources they need to succeed.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-lg shadow-sm border border-border/50 text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users size={32} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-1">Sophia Chen</h3>
                <p className="text-sm text-muted-foreground mb-3">Co-Founder & CTO</p>
                <p className="text-sm text-muted-foreground">
                  Tech innovator with a background in AI and machine learning. Leads our platform development and matching algorithm optimization.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-lg shadow-sm border border-border/50 text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users size={32} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-1">Marcus Williams</h3>
                <p className="text-sm text-muted-foreground mb-3">Head of Investor Relations</p>
                <p className="text-sm text-muted-foreground">
                  Former VC with 15+ years of experience. Ensures our platform meets the needs of investors across all stages and sectors.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Contact Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Get in Touch</h2>
              <p className="text-muted-foreground mb-8">
                Have questions about Flubo or want to learn more about how we can help you? Reach out to our team today.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                <div className="flex items-center justify-center space-x-3 p-4 bg-background rounded-lg border border-border/50">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span>Live Chat Support</span>
                </div>
                
                <div className="flex items-center justify-center space-x-3 p-4 bg-background rounded-lg border border-border/50">
                  <Mail className="h-5 w-5 text-primary" />
                  <span>support@flubo.com</span>
                </div>
              </div>
              
              <Link to="/auth">
                <Button size="lg" className="font-medium">
                  Join Flubo Today <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
