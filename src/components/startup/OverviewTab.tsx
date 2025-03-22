
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Calendar, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export const OverviewTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileViewCount, setProfileViewCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [completionTasks, setCompletionTasks] = useState([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [recentMatches, setRecentMatches] = useState([]);
  
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile views count
      const { count: viewCount, error: viewError } = await supabase
        .from('profile_views')
        .select('id', { count: 'exact' })
        .eq('startup_id', user.id);
      
      if (viewError) throw viewError;
      setProfileViewCount(viewCount || 0);
      
      // Fetch investor matches data
      const { data: matchesData, error: matchesError } = await supabase
        .from('investor_matches')
        .select('id, status')
        .eq('startup_id', user.id);
      
      if (matchesError) throw matchesError;
      
      // Count total and pending matches
      setMatchCount(matchesData?.length || 0);
      const pendingMatches = matchesData?.filter(match => match.status === 'pending') || [];
      setPendingCount(pendingMatches.length);
      
      // Fetch profile completion tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('profile_completion_tasks')
        .select('*')
        .eq('startup_id', user.id);
      
      if (tasksError) throw tasksError;
      
      setCompletionTasks(tasksData || []);
      
      // Calculate completion percentage
      if (tasksData && tasksData.length > 0) {
        const completedTasks = tasksData.filter(task => task.completed);
        const percentage = Math.round((completedTasks.length / tasksData.length) * 100);
        setCompletionPercentage(percentage);
      }
      
      // Fetch recent matches with investor data
      const { data: recentMatchesData, error: recentError } = await supabase
        .from('investor_matches')
        .select(`
          id,
          created_at,
          match_score,
          status,
          investor_id
        `)
        .eq('startup_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (recentError) throw recentError;
      
      // For each match, fetch investor profile data separately
      const enhancedMatches = await Promise.all((recentMatchesData || []).map(async (match) => {
        if (!match.investor_id) {
          return {
            ...match,
            investor: { name: 'Anonymous Investor' }
          };
        }
        
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('id', match.investor_id)
            .maybeSingle();
            
          if (profileError) throw profileError;
          
          return {
            ...match,
            investor: {
              id: match.investor_id,
              name: profileData?.name || 'Anonymous Investor'
            }
          };
        } catch (error) {
          console.error("Error fetching investor profile:", error);
          return {
            ...match,
            investor: { 
              id: match.investor_id,
              name: 'Anonymous Investor' 
            }
          };
        }
      }));
      
      setRecentMatches(enhancedMatches || []);
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewMatches = () => {
    navigate('/startup/messages');
  };
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Profile Views</h3>
            <span className="p-2 rounded-full bg-primary/10 text-primary">
              <Users size={18} />
            </span>
          </div>
          <p className="text-2xl font-bold">{profileViewCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Total profile views</p>
        </div>
        
        <div className="glass-card p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Investor Matches</h3>
            <span className="p-2 rounded-full bg-accent/10 text-accent">
              <Calendar size={18} />
            </span>
          </div>
          <p className="text-2xl font-bold">{matchCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Total matches</p>
        </div>
        
        <div className="glass-card p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Responses</h3>
            <span className="p-2 rounded-full bg-amber-500/10 text-amber-500">
              <Calendar size={18} />
            </span>
          </div>
          <p className="text-2xl font-bold">{pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Awaiting your response</p>
        </div>
      </div>
      
      {/* Profile Completion */}
      <div className="glass-card p-6 rounded-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium mb-1">Complete Your Profile</h3>
            <p className="text-sm text-muted-foreground">Finish setting up your startup profile to attract investors</p>
          </div>
          <Button 
            variant="outline" 
            className="text-xs"
            onClick={() => navigate('/startup/profile')}
          >
            Edit Profile
          </Button>
        </div>
        
        <div className="mb-2 flex justify-between text-sm">
          <span>Profile completion</span>
          <span className="font-medium">{completionPercentage}%</span>
        </div>
        
        <div className="h-2 bg-secondary rounded-full mb-4">
          <div 
            className="h-2 bg-accent rounded-full" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        
        <div className="space-y-3">
          {completionTasks.map((task) => (
            <div key={task.id} className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-3 flex-shrink-0 ${task.completed ? 'bg-accent' : 'border border-border'}`}>
                {task.completed && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                {task.task_name}
              </span>
            </div>
          ))}
          
          {completionTasks.length === 0 && (
            <p className="text-sm text-muted-foreground">No profile tasks found. Please visit your profile to get started.</p>
          )}
        </div>
      </div>
      
      {/* Recent Matches */}
      <div className="glass-card p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Recent Investor Matches</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs flex items-center"
            onClick={() => navigate('/startup/matches')}
          >
            <span>View All</span>
            <ArrowUpRight size={14} className="ml-1" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {recentMatches.length > 0 ? (
            recentMatches.map((match) => (
              <div key={match.id} className="flex items-center justify-between p-3 rounded-md bg-background/40 border border-border/60">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                    {match.investor?.name?.charAt(0) || 'I'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{match.investor?.name || 'Anonymous Investor'}</p>
                    <p className="text-xs text-muted-foreground">
                      Match score: {match.match_score || 'N/A'}%
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={handleViewMatches}
                >
                  View Details
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No investor matches yet</p>
              <p className="text-sm mt-1">Complete your profile to attract investors</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
