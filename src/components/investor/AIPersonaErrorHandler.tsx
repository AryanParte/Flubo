
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const AIPersonaErrorHandler: React.FC = () => {
  // Just render the questions directly
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Persona Questions</CardTitle>
        <CardDescription>
          These are the questions your AI persona asks startups during conversations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Default Questions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            These standard questions are always available to your AI persona
          </p>
          <div className="space-y-2 pl-4 border-l-2 border-border">
            <div className="py-2 px-3 bg-secondary/30 rounded-md">
              <p className="text-sm">Tell me about your business model?</p>
            </div>
            <div className="py-2 px-3 bg-secondary/30 rounded-md">
              <p className="text-sm">What traction do you have so far?</p>
            </div>
            <div className="py-2 px-3 bg-secondary/30 rounded-md">
              <p className="text-sm">Who are your competitors and how do you differentiate?</p>
            </div>
            <div className="py-2 px-3 bg-secondary/30 rounded-md">
              <p className="text-sm">What's your go-to-market strategy?</p>
            </div>
            <div className="py-2 px-3 bg-secondary/30 rounded-md">
              <p className="text-sm">Tell me about your team background?</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
