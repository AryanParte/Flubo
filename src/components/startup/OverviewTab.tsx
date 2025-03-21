import React, { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export const OverviewTab = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: "Profile Views", value: 0, trend: "neutral", percent: 0 },
    { label: "Investor Matches", value: 0, trend: "neutral", percent: 0 },
    { label: "Messages", value: 0, trend: "neutral", percent: 0 },
    { label: "Completion", value: "0%", trend: "neutral", percent: 0 },
  ]);
  const [matches, setMatches] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [totalTasksCount, setTotalTasksCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile views count
      const { data: profileViews, error: profileViewsError } = await supabase
        .from('profile_views')
        .select('*')
        .eq('startup_id', user.id);
      
      if (profileViewsError) throw profileViewsError;
      
      // Fetch investor matches
      const { data: investorMatches, error: matchesError } = await supabase
        .from('investor_matches')
        .select(`
          *,
          investor:investor_id(id, name)
        `)
        .eq('startup_id', user.id)
        .order('match_score', { ascending: false })
        .limit(3);
      
      if (matchesError) throw matchesError;
      
      // Fetch messages count
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
      
      if (messagesError) throw messagesError;
      
      // Fetch profile completion tasks
      const { data: completionTasks, error: tasksError } = await supabase
        .from('profile_completion_tasks')
        .select('*')
        .eq('startup_id', user.id);
      
      if (tasksError) throw tasksError;
      
      // If no tasks exist yet, create default tasks
      if (!completionTasks || completionTasks.length === 0) {
        await createDefaultTasks();
        const { data: newTasks } = await supabase
          .from('profile_completion_tasks')
          .select('*')
          .eq('startup_id', user.id);
        
        if (newTasks) {
          setTasks(newTasks);
          const completed = newTasks.filter(task => task.completed).length;
          setCompletedTasksCount(completed);
          setTotalTasksCount(newTasks.length);
        }
      } else {
        setTasks(completionTasks);
        const completed = completionTasks.filter(task => task.completed).length;
        setCompletedTasksCount(completed);
        setTotalTasksCount(completionTasks.length);
      }
      
      // Calculate completion percentage
      const completionPercentage = totalTasksCount > 0 
        ? Math.round((completedTasksCount / totalTasksCount) * 100) 
        : 0;
      
      // Update stats
      setStats([
        { 
          label: "Profile Views", 
          value: profileViews?.length || 0, 
          trend: "up", 
          percent: 0 
        },
        { 
          label: "Investor Matches", 
          value: investorMatches?.length || 0, 
          trend: "up", 
          percent: 0 
        },
        { 
          label: "Messages", 
          value: messages?.length || 0, 
          trend: "neutral", 
          percent: 0 
        },
        { 
          label: "Completion", 
          value: `${completionPercentage}%`, 
          trend: "neutral", 
          percent: 0 
        },
      ]);
      
      // Format matches data
      if (investorMatches && investorMatches.length > 0) {
        const formattedMatches = investorMatches.map(match => ({
          name: match.investor?.name || "Unknown Investor",
          score: match.match_score,
          region: "Global", // This would come from the investor profile in a real app
          focus: "Various Industries", // This would come from the investor profile in a real app
          status: match.status
        }));
        
        setMatches(formattedMatches);
      }
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTasks = async () => {
    const defaultTasks = [
      { task_name: "Add company details", completed: false },
      { task_name: "Upload pitch deck", completed: false },
      { task_name: "Connect team members", completed: false },
      { task_name: "Add product information", completed: false },
      { task_name: "Set funding requirements", completed: false }
    ];
    
    for (const task of defaultTasks) {
      await supabase.from('profile_completion_tasks').insert({
        startup_id: user.id,
        task_name: task.task_name,
        completed: task.completed
      });
    }
  };

  const handleViewAllMatches = () => {
    toast({
      title: "View all matches",
      description: "Navigating to all investor matches",
    });
  };

  const handleContactClick = (investorName: string) => {
    toast({
      title: "Contact initiated",
      description: `Opening chat with ${investorName}`,
    });
  };

  const handleTaskClick = async (taskId: string, completed: boolean) => {
    if (completed) return; // Don't allow uncompleting tasks
    
    try {
      const { error } = await supabase
        .from('profile_completion_tasks')
        .update({ 
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);
      
      if (error) throw error;
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed: true } : task
      ));
      
      setCompletedTasksCount(prev => prev + 1);
      
      toast({
        title: "Task completed",
        description: "Your profile completion has been updated",
      });
      
      // Refresh the stats
      const completionPercentage = totalTasksCount > 0 
        ? Math.round(((completedTasksCount + 1) / totalTasksCount) * 100) 
        : 0;
      
      setStats(prev => prev.map(stat => 
        stat.label === "Completion" 
          ? { ...stat, value: `${completionPercentage}%` } 
          : stat
      ));
      
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="glass-card p-6 rounded-lg animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
            <div className="flex items-center mt-3">
              <span 
                className={`text-xs font-medium ${
                  stat.trend === "up" ? "text-green-500" : 
                  stat.trend === "down" ? "text-red-500" : 
                  "text-muted-foreground"
                }`}
              >
                {stat.trend === "up" ? "↑" : stat.trend === "down" ? "↓" : "–"} 
                {stat.percent > 0 && `${stat.percent}%`}
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs. last month</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Investor Matches */}
        <div className="lg:col-span-2 glass-card rounded-lg p-6 animate-fade-in" style={{ animationDelay: "400ms" }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-medium">Recent Investor Matches</h2>
            <button 
              className="text-sm text-accent hover:text-accent/80 transition-colors"
              onClick={handleViewAllMatches}
            >
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {matches.length > 0 ? (
              matches.map((investor, index) => (
                <div 
                  key={index} 
                  className="flex items-center p-3 rounded-md bg-background/50 border border-border/40 transition-transform hover:translate-x-1 cursor-pointer"
                  onClick={() => handleContactClick(investor.name)}
                >
                  <div className={`w-10 h-10 rounded-full ${index % 2 === 0 ? 'bg-accent/10 text-accent' : 'bg-teal-500/10 text-teal-600'} flex items-center justify-center mr-4`}>
                    {investor.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{investor.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{investor.region} • {investor.focus}</p>
                  </div>
                  <div className={`${index % 2 === 0 ? 'bg-accent/10 text-accent' : 'bg-teal-500/10 text-teal-600'} text-xs font-medium rounded-full px-2.5 py-1 flex items-center`}>
                    {investor.score}% Match
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No investor matches yet.</p>
                <p className="text-sm mt-2">Complete your profile to start matching with investors!</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Profile Completion */}
        <div className="glass-card rounded-lg p-6 animate-fade-in" style={{ animationDelay: "500ms" }}>
          <h2 className="font-medium mb-6">Complete Your Profile</h2>
          
          <div className="space-y-4">
            {tasks.map((item, index) => (
              <div 
                key={item.id} 
                className="flex items-center cursor-pointer"
                onClick={() => handleTaskClick(item.id, item.completed)}
              >
                <div 
                  className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${
                    item.completed ? (index % 2 === 0 ? "bg-accent text-white" : "bg-teal-500 text-white") : "bg-secondary border border-border"
                  }`}
                >
                  {item.completed && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span 
                  className={`text-sm ${
                    item.completed ? "text-muted-foreground line-through" : "text-foreground"
                  }`}
                >
                  {item.task_name}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-accent to-teal-500"
                style={{ width: `${(completedTasksCount / totalTasksCount) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {completedTasksCount} of {totalTasksCount} tasks completed
            </p>
          </div>
          
          <button 
            className="w-full mt-6 py-2 rounded-md bg-gradient-to-r from-accent to-teal-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            onClick={() => {
              toast({
                title: "Continue Setup",
                description: "Let's finish setting up your profile",
              });
            }}
          >
            Continue Setup
          </button>
        </div>
      </div>
    </div>
  );
};
