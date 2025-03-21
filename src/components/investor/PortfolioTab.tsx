
import React from "react";
import { BarChart3, Briefcase, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export const PortfolioTab = () => {
  const handleAddPortfolioClick = () => {
    toast({
      title: "Add portfolio company",
      description: "Opening form to add a portfolio company",
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">Your Portfolio</h2>
        <Button size="sm" onClick={handleAddPortfolioClick}>
          Add Company
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 border border-border rounded-lg bg-background">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 mr-3">
              <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Investments</p>
              <p className="text-lg font-medium">$1.25M</p>
            </div>
          </div>
        </div>
        <div className="p-4 border border-border rounded-lg bg-background">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20 mr-3">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Portfolio Companies</p>
              <p className="text-lg font-medium">5</p>
            </div>
          </div>
        </div>
        <div className="p-4 border border-border rounded-lg bg-background">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20 mr-3">
              <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Return</p>
              <p className="text-lg font-medium">+18.3%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="p-4 bg-muted/50">
          <h3 className="font-medium">Portfolio Companies</h3>
        </div>
        <div className="divide-y divide-border">
          {[
            { name: "TechVenture AI", investment: "$500K", date: "Mar 2023", return: "+22%" },
            { name: "GreenEnergy Solutions", investment: "$350K", date: "Nov 2022", return: "+15%" },
            { name: "FinTech Innovators", investment: "$200K", date: "Jun 2022", return: "+24%" },
            { name: "HealthTech Global", investment: "$125K", date: "Feb 2022", return: "+12%" },
            { name: "EdTech Pioneers", investment: "$75K", date: "Sep 2021", return: "+19%" }
          ].map((company, index) => (
            <div key={index} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{company.name}</h4>
                  <p className="text-sm text-muted-foreground">Invested: {company.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{company.investment}</p>
                  <p className="text-sm text-green-600 dark:text-green-400">{company.return}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
