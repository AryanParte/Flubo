import React, { useState } from "react";
import { VerifyPersonaSettings } from "@/components/investor/VerifyPersonaSettings";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

export default function FixPersonaSettings() {
  const { user } = useAuth();
  const [investorId, setInvestorId] = useState<string>("");
  const [showTool, setShowTool] = useState<boolean>(false);
  const [showOwnSettings, setShowOwnSettings] = useState<boolean>(false);
  const [isFixing, setIsFixing] = useState<boolean>(false);

  const fixSettings = async (targetInvestorId: string) => {
    if (!targetInvestorId) return;
    
    try {
      setIsFixing(true);
      
      const defaultQuestions = [
        { 
          id: crypto.randomUUID(),
          question: "What problem is your startup solving?", 
          enabled: true 
        },
        { 
          id: crypto.randomUUID(),
          question: "How did you come up with this idea?", 
          enabled: true 
        }
      ];
      
      const response = await fetch(
        "https://vsxnjnvwtgehagxbhdzh.supabase.co/functions/v1/fix-persona-settings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzeG5qbnZ3dGdlaGFneGJoZHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1ODkzOTQsImV4cCI6MjA1ODE2NTM5NH0.4SEISsoUanD3lFIswUzBFo4ll3qC2Yd6mlN8rVwuyFo`
          },
          body: JSON.stringify({
            investorId: targetInvestorId,
            customQuestions: defaultQuestions
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fix settings: ${errorData}`);
      }
      
      const data = await response.json();
      
      toast({
        title: "Success",
        description: `${data.message} with ${data.questionCount} custom questions`,
      });
      
      // Refresh settings display after fixing
      if (showOwnSettings || showTool) {
        setTimeout(() => {
          setShowOwnSettings(false);
          setShowTool(false);
          setTimeout(() => {
            setShowOwnSettings(user?.id === targetInvestorId);
            setShowTool(user?.id !== targetInvestorId && targetInvestorId === investorId);
          }, 100);
        }, 100);
      }
      
    } catch (error) {
      console.error("Error fixing settings:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="container py-8 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Fix AI Persona Settings</h1>
      <p className="text-muted-foreground">
        This page helps fix issues with custom questions in the investor AI persona.
      </p>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Your Settings</CardTitle>
            <CardDescription>
              Check and fix your own AI persona settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button onClick={() => setShowOwnSettings(!showOwnSettings)}>
                {showOwnSettings ? "Hide" : "Show"} My Settings
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => fixSettings(user.id)}
                disabled={isFixing}
              >
                {isFixing ? "Fixing..." : "Fix My Settings"}
              </Button>
            </div>
            
            {showOwnSettings && (
              <div className="mt-4">
                <VerifyPersonaSettings investorId={user.id} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Check Settings For Another Investor</CardTitle>
          <CardDescription>
            Enter the investor's ID to check their AI persona settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="investorId" className="text-sm font-medium">
              Investor ID
            </label>
            <Input
              id="investorId"
              placeholder="Enter investor ID"
              value={investorId}
              onChange={(e) => setInvestorId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              For example: b8d27fa9-9f2d-447d-9cf9-4993254c73bc
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={() => setShowTool(true)} 
              disabled={!investorId.trim() || isFixing}
            >
              Check Settings
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => fixSettings(investorId)}
              disabled={!investorId.trim() || isFixing}
            >
              {isFixing ? "Fixing..." : "Fix Settings"}
            </Button>
          </div>
          
          {showTool && investorId && (
            <div className="mt-4">
              <VerifyPersonaSettings investorId={investorId} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debugging Steps</CardTitle>
          <CardDescription>
            Follow these steps to fix missing custom questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-3">
            <li>
              Use this page to check if the investor has AI persona settings in the database.
            </li>
            <li>
              If no settings exist, use the "Create Default Settings" button to create them.
            </li>
            <li>
              If settings exist but custom questions are missing or invalid, use the fix tool.
            </li>
            <li>
              After fixing the settings, test the AI persona by starting a new conversation.
            </li>
            <li>
              Monitor the console logs to ensure custom questions are being loaded and asked.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
} 