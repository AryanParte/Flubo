
import React, { useState } from "react";
import { User, Bell, Sliders, Shield, MessageSquare } from "lucide-react";
import { AIPersonaErrorHandler } from "./AIPersonaErrorHandler";
import { useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Placeholder components until we implement the full versions
const AccountSettings = () => (
  <Card className="bg-card-dark">
    <CardHeader>
      <CardTitle>Account Settings</CardTitle>
      <CardDescription>Manage your account information</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Account settings will be implemented soon.</p>
    </CardContent>
  </Card>
);

const NotificationSettings = () => (
  <Card className="bg-card-dark">
    <CardHeader>
      <CardTitle>Notification Settings</CardTitle>
      <CardDescription>Manage your notification preferences</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Notification settings will be implemented soon.</p>
    </CardContent>
  </Card>
);

const InvestmentPreferences = () => (
  <Card className="bg-card-dark">
    <CardHeader>
      <CardTitle>Investment Preferences</CardTitle>
      <CardDescription>Manage your investment criteria</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Investment preferences will be implemented soon.</p>
    </CardContent>
  </Card>
);

const SecuritySettings = () => (
  <Card className="bg-card-dark">
    <CardHeader>
      <CardTitle>Security Settings</CardTitle>
      <CardDescription>Manage your security preferences</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Security settings will be implemented soon.</p>
    </CardContent>
  </Card>
);

export const SettingsTab = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'ai-persona' ? 'ai-persona' : 'account';
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:w-64">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold mb-6">Settings</h3>
          <div className="space-y-1">
            {[
              { id: 'account', label: 'Account', icon: User },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'preferences', label: 'Investment Preferences', icon: Sliders },
              { id: 'ai-persona', label: 'AI Persona', icon: MessageSquare },
              { id: 'security', label: 'Security', icon: Shield },
            ].map(tab => (
              <button
                key={tab.id}
                className={`flex items-center w-full space-x-3 px-4 py-3 rounded-md text-base ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        {activeTab === 'account' && (
          <AccountSettings />
        )}
        
        {activeTab === 'notifications' && (
          <NotificationSettings />
        )}
        
        {activeTab === 'preferences' && (
          <InvestmentPreferences />
        )}
        
        {activeTab === 'ai-persona' && (
          <AIPersonaErrorHandler />
        )}
        
        {activeTab === 'security' && (
          <SecuritySettings />
        )}
      </div>
    </div>
  );
};
