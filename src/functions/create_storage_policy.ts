
import { supabase } from "@/lib/supabase";
import { executeSQL } from "@/lib/db-utils";

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
    // First, check if the policy already exists (using direct query instead of RPC)
    const { data: existingPolicies, error: checkError } = await supabase
      .from('storage.policies')
      .select('*')
      .eq('name', policyName)
      .eq('bucket_id', bucketName);
      
    if (checkError) {
      console.warn("Could not check for existing policies:", checkError);
    }
    
    // If policy already exists, return success
    if (existingPolicies && existingPolicies.length > 0) {
      console.log("Policy already exists:", existingPolicies[0]);
      return { data: existingPolicies[0], error: null };
    }
    
    // Escape strings for SQL safety
    const escapedPolicyName = policyName.replace(/'/g, "''");
    const escapedBucketName = bucketName.replace(/'/g, "''");
    const escapedDefinition = JSON.stringify(definition).replace(/'/g, "''");
    
    // Create policy using raw SQL through executeSQL
    console.log("Creating storage policy via SQL...");
    const policySQL = `
      INSERT INTO storage.policies (name, definition, bucket_id)
      VALUES (
        '${escapedPolicyName}',
        '${escapedDefinition}'::jsonb,
        '${escapedBucketName}'
      )
      RETURNING *;
    `;
    
    const result = await executeSQL(policySQL);
    
    if (!result.success) {
      console.error("Failed to create storage policy:", result.error);
      throw result.error;
    }
    
    console.log("Storage policy created successfully");
    return { data: { name: policyName, bucket_id: bucketName }, error: null };
  } catch (error) {
    console.error("Error creating storage policy:", error);
    return { data: null, error };
  }
}
