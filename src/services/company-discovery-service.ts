
import { supabase } from "@/lib/supabase";
import { Startup } from "@/types/startup";
import { toast } from "@/components/ui/use-toast";
import { AppliedFilters, SortOption } from "@/hooks/use-discover-companies";

/**
 * Fetches companies from the database with filters applied
 */
export const fetchCompanies = async (
  userId: string,
  appliedFilters: AppliedFilters,
  sortOption: SortOption
) => {
  try {
    // Get existing connections to exclude
    const { data: existingConnections } = await supabase
      .from('investor_matches')
      .select('startup_id')
      .eq('investor_id', userId);
    
    // Create exclusion list
    const excludedIds = existingConnections?.map(match => match.startup_id) || [];
    
    if (userId) {
      excludedIds.push(userId);
    }
    
    // Build the query
    let query = supabase
      .from('startup_profiles')
      .select(`
        id,
        name,
        tagline,
        bio,
        industry,
        location,
        stage,
        raised_amount,
        created_at,
        looking_for_funding,
        looking_for_design_partner,
        demo_url,
        demo_video,
        demo_video_path,
        website,
        stealth_mode
      `)
      // Add filter for stealth mode - only show companies NOT in stealth mode
      .eq('stealth_mode', false);
    
    // Apply exclusions
    if (excludedIds.length > 0) {
      for (const id of excludedIds) {
        if (id) {
          query = query.neq('id', id);
        }
      }
    }
    
    // Apply limit
    query = query.limit(20);
    
    // Apply filters
    if (appliedFilters.stage && appliedFilters.stage.length > 0) {
      query = query.in('stage', appliedFilters.stage);
    }
    
    if (appliedFilters.industry && appliedFilters.industry.length > 0) {
      query = query.in('industry', appliedFilters.industry);
    }
    
    if (appliedFilters.location && appliedFilters.location.length > 0) {
      query = query.in('location', appliedFilters.location);
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching companies:', error);
    toast({
      title: 'Error',
      description: 'Failed to load companies',
      variant: 'destructive',
    });
    return null;
  }
};

/**
 * Records a user's interest in a company
 */
export const recordInterest = async (
  userId: string,
  companyId: string,
  score: number
) => {
  try {
    // First, create a connection record between the investor and startup
    const { error: connectionError } = await supabase
      .from('startup_investor_connections')
      .upsert({
        startup_id: companyId,
        investor_id: userId
      });
      
    if (connectionError) {
      console.error('Error creating connection:', connectionError);
    }

    const { error } = await supabase
      .from('investor_matches')
      .insert({
        investor_id: userId,
        startup_id: companyId,
        match_score: score,
        status: 'pending'
      });
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error recording interest:', error);
    toast({
      title: 'Error',
      description: 'Failed to record your interest',
      variant: 'destructive',
    });
    return { success: false, error };
  }
};

/**
 * Records a user's decision to skip a company
 */
export const skipCompany = async (userId: string, companyId: string) => {
  try {
    const { error } = await supabase
      .from('investor_matches')
      .insert({
        investor_id: userId,
        startup_id: companyId,
        status: 'skipped'
      });
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error recording skip:', error);
    toast({
      title: 'Error',
      description: 'Failed to record your choice',
      variant: 'destructive',
    });
    return { success: false, error };
  }
};

/**
 * Creates a connection between a startup and an investor
 * Used when a startup reaches out to an investor
 */
export const createStartupInvestorConnection = async (
  startupId: string,
  investorId: string
) => {
  try {
    const { error } = await supabase
      .from('startup_investor_connections')
      .upsert({
        startup_id: startupId,
        investor_id: investorId
      });
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error creating connection:', error);
    return { success: false, error };
  }
};

/**
 * Updates the stealth mode setting for a startup
 */
export const updateStealthMode = async (userId: string, stealthMode: boolean) => {
  try {
    const { error } = await supabase
      .from('startup_profiles')
      .update({ stealth_mode: stealthMode })
      .eq('id', userId);
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating stealth mode:', error);
    toast({
      title: 'Error',
      description: 'Failed to update stealth mode setting',
      variant: 'destructive',
    });
    return { success: false, error };
  }
};
