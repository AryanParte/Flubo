import React, { useState } from "react";
import { User, Bell, Sliders, Shield, MessageSquare } from "lucide-react";
import { AccountSettings } from "./settings/AccountSettings";
import { NotificationSettings } from "./settings/NotificationSettings";
import { InvestmentPreferences } from "./settings/InvestmentPreferences";
import { SecuritySettings } from "./settings/SecuritySettings";
import { AIPersonaSettings } from "./AIPersonaSettings";
import { useSearchParams } from "react-router-dom";

export const SettingsTab = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'ai-persona' ? 'ai-persona' : 'account';
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="glass-card rounded-lg p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-64">
          <div className="space-y-1">
            <h3 className="text-lg font-medium mb-4">Settings</h3>
            {[
              { id: 'account', label: 'Account', icon: User },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'preferences', label: 'Investment Preferences', icon: Sliders },
              { id: 'ai-persona', label: 'AI Persona', icon: MessageSquare },
              { id: 'security', label: 'Security', icon: Shield },
            ].map(tab => (
              <button
                key={tab.id}
                className={`flex items-center w-full space-x-2 px-3 py-2 rounded-md text-sm ${
                  activeTab === tab.id
                    ? 'bg-accent text-white'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
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
            <AIPersonaSettings />
          )}
          
          {activeTab === 'security' && (
            <SecuritySettings />
          )}
        </div>
      </div>
    </div>
  );
};
