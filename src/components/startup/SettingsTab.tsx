
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const SettingsTab = () => {
  const [notificationsForm, useForm] = useState({});
  
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Notification preferences updated",
      description: "Your notification settings have been saved",
    });
  };

  return (
    <div>
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications">
          <div className="glass-card p-6 rounded-lg">
            <h2 className="text-lg font-medium mb-6">Notification Preferences</h2>
            
            <form onSubmit={handleSaveNotifications} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-md font-medium">Email Notifications</h3>
                
                {[
                  { id: "new-match", label: "New investor matches", checked: true },
                  { id: "messages", label: "New messages", checked: true },
                  { id: "profile-views", label: "Profile views", checked: false },
                  { id: "funding-updates", label: "Funding updates", checked: true },
                  { id: "newsletters", label: "Platform newsletters", checked: false },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <label htmlFor={item.id} className="text-sm">{item.label}</label>
                    <input 
                      id={item.id}
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                    />
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-md font-medium">Push Notifications</h3>
                
                {[
                  { id: "push-matches", label: "New investor matches", checked: true },
                  { id: "push-messages", label: "New messages", checked: true },
                  { id: "push-reminders", label: "Meeting reminders", checked: true },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <label htmlFor={item.id} className="text-sm">{item.label}</label>
                    <input 
                      id={item.id}
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                    />
                  </div>
                ))}
              </div>
              
              <Button type="submit">Save Notification Preferences</Button>
            </form>
          </div>
        </TabsContent>
        
        <TabsContent value="account">
          <div className="glass-card p-6 rounded-lg">
            <h2 className="text-lg font-medium mb-6">Account Settings</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium mb-4">Email Address</h3>
                <div className="flex items-center gap-3">
                  <input 
                    type="email"
                    defaultValue="" 
                    placeholder="Not set"
                    readOnly 
                    className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                  <Button variant="outline" size="sm" onClick={() => {
                    toast({
                      title: "Change email",
                      description: "Email change functionality coming soon",
                    });
                  }}>
                    Change
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-4">Password</h3>
                <Button variant="outline" size="sm" onClick={() => {
                  toast({
                    title: "Change password",
                    description: "Password change functionality coming soon",
                  });
                }}>
                  Change Password
                </Button>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-4">Subscription Plan</h3>
                <div className="p-4 border border-border rounded-md bg-background/40 max-w-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Free Plan</p>
                      <p className="text-sm text-muted-foreground">Basic features</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      toast({
                        title: "Upgrade subscription",
                        description: "Subscription management coming soon",
                      });
                    }}>
                      Upgrade
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-4 text-destructive">Danger Zone</h3>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Deactivate account",
                      description: "This action cannot be undone",
                      variant: "destructive",
                    });
                  }}
                >
                  Deactivate Account
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
