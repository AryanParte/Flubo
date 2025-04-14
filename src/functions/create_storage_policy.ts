
import { supabase } from "@/lib/supabase";

/**
 * Create a storage bucket policy
 * @param bucketName The name of the bucket
 * @param policyName The name of the policy
 * @param definition The policy definition
 * @returns Promise with the created policy data
 */
export async function createStoragePolicy(
  bucketName: string,
  policyName: string,
  definition: {
    name: string;
    action: string;
    role: string;
    check: any;
  }
) {
  try {
    // First, check if the policy already exists
    const { data: policies, error: policiesError } = await supabase
      .from('storage.policies')
      .select('*')
      .eq('name', policyName)
      .eq('bucket_id', bucketName);
      
    if (policiesError) {
      console.warn("Could not check for existing policies:", policiesError);
    }
    
    // If policy already exists, return success
    if (policies && policies.length > 0) {
      return { data: policies[0], error: null };
    }
    
    // Create the policy since it doesn't exist
    const { data, error } = await supabase.rpc('create_storage_policy', {
      bucket_name: bucketName,
      policy_name: policyName,
      definition: definition
    });
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Error creating storage policy:", error);
    return { data: null, error };
  }
}
