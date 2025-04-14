
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
      console.log("Policy already exists:", policies[0]);
      return { data: policies[0], error: null };
    }
    
    // Create policy using raw SQL through the exec_sql function
    console.log("Creating storage policy via SQL...");
    const policySQL = `
      INSERT INTO storage.policies (name, definition, bucket_id)
      VALUES (
        '${policyName}',
        '${JSON.stringify(definition)}'::jsonb,
        '${bucketName}'
      )
      RETURNING *;
    `;
    
    const result = await executeSQL(policySQL);
    
    if (!result.success) {
      throw result.error;
    }
    
    console.log("Storage policy created successfully");
    return { data: { name: policyName, bucket_id: bucketName }, error: null };
  } catch (error) {
    console.error("Error creating storage policy:", error);
    return { data: null, error };
  }
}
