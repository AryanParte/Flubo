
import React from "react";
import { MessageSquare, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const MatchesTab = () => {
  const handleContactClick = (investorName: string) => {
    toast({
      title: "Contact initiated",
      description: `Opening chat with ${investorName}`,
    });
  };

  const handleViewProfile = (investorName: string) => {
    toast({
      title: "View profile",
      description: `Viewing ${investorName}'s profile`,
    });
  };

  return (
    <div>
      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Matches</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Blue Venture Capital", score: 92, region: "North America", focus: "AI & Machine Learning", status: "accepted" },
              { name: "Global Impact Fund", score: 87, region: "Europe", focus: "Sustainability", status: "new" },
              { name: "Tech Accelerator Group", score: 84, region: "Asia", focus: "SaaS", status: "new" },
              { name: "Midwest Angels", score: 79, region: "North America", focus: "Fintech", status: "accepted" },
              { name: "Green Future Fund", score: 75, region: "Europe", focus: "CleanTech", status: "declined" },
            ].map((investor, index) => (
              <div 
                key={index} 
                className="rounded-lg border border-border p-5 bg-background/50"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent mr-3">
                      {investor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{investor.name}</h3>
                      <p className="text-xs text-muted-foreground">{investor.region}</p>
                    </div>
                  </div>
                  <div className="bg-accent/10 text-accent text-xs font-medium rounded-full px-2.5 py-1">
                    {investor.score}% Match
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  Focus: {investor.focus}
                </p>

                <div className="text-xs text-muted-foreground mb-4 flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                    investor.status === 'new' ? 'bg-blue-500' : 
                    investor.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  <span className="capitalize">{investor.status}</span>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewProfile(investor.name)}
                  >
                    <Info size={14} className="mr-1" />
                    Profile
                  </Button>
                  <Button 
                    variant="accent" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleContactClick(investor.name)}
                  >
                    <MessageSquare size={14} className="mr-1" />
                    Contact
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="new">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Global Impact Fund", score: 87, region: "Europe", focus: "Sustainability", status: "new" },
              { name: "Tech Accelerator Group", score: 84, region: "Asia", focus: "SaaS", status: "new" },
            ].map((investor, index) => (
              <div 
                key={index} 
                className="rounded-lg border border-border p-5 bg-background/50"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent mr-3">
                      {investor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{investor.name}</h3>
                      <p className="text-xs text-muted-foreground">{investor.region}</p>
                    </div>
                  </div>
                  <div className="bg-accent/10 text-accent text-xs font-medium rounded-full px-2.5 py-1">
                    {investor.score}% Match
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Focus: {investor.focus}
                </p>

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewProfile(investor.name)}
                  >
                    <Info size={14} className="mr-1" />
                    Profile
                  </Button>
                  <Button 
                    variant="accent" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleContactClick(investor.name)}
                  >
                    <MessageSquare size={14} className="mr-1" />
                    Contact
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accepted">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Blue Venture Capital", score: 92, region: "North America", focus: "AI & Machine Learning", status: "accepted" },
              { name: "Midwest Angels", score: 79, region: "North America", focus: "Fintech", status: "accepted" },
            ].map((investor, index) => (
              <div 
                key={index} 
                className="rounded-lg border border-border p-5 bg-background/50"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent mr-3">
                      {investor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{investor.name}</h3>
                      <p className="text-xs text-muted-foreground">{investor.region}</p>
                    </div>
                  </div>
                  <div className="bg-accent/10 text-accent text-xs font-medium rounded-full px-2.5 py-1">
                    {investor.score}% Match
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Focus: {investor.focus}
                </p>

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewProfile(investor.name)}
                  >
                    <Info size={14} className="mr-1" />
                    Profile
                  </Button>
                  <Button 
                    variant="accent" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleContactClick(investor.name)}
                  >
                    <MessageSquare size={14} className="mr-1" />
                    Contact
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="declined">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Green Future Fund", score: 75, region: "Europe", focus: "CleanTech", status: "declined" },
            ].map((investor, index) => (
              <div 
                key={index} 
                className="rounded-lg border border-border p-5 bg-background/50"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent mr-3">
                      {investor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{investor.name}</h3>
                      <p className="text-xs text-muted-foreground">{investor.region}</p>
                    </div>
                  </div>
                  <div className="bg-accent/10 text-accent text-xs font-medium rounded-full px-2.5 py-1">
                    {investor.score}% Match
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Focus: {investor.focus}
                </p>

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewProfile(investor.name)}
                  >
                    <Info size={14} className="mr-1" />
                    Profile
                  </Button>
                  <Button 
                    variant="accent" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleContactClick(investor.name)}
                  >
                    <MessageSquare size={14} className="mr-1" />
                    Contact
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
