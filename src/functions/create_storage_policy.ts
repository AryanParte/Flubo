
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
    console.log(`Creating storage policy: ${policyName} for bucket: ${bucketName}`);
    
    // First, check if the policy already exists using direct SQL
    const checkSQL = `
      SELECT * FROM storage.policies 
      WHERE name = '${policyName.replace(/'/g, "''")}' 
      AND bucket_id = '${bucketName.replace(/'/g, "''")}'
    `;
    
    const { success: checkSuccess, error: checkError } = await executeSQL(checkSQL);
    
    if (!checkSuccess) {
      console.error("Error checking for existing policy:", checkError);
    }
    
    // Create policy using raw SQL through executeSQL with explicit id generation
    const policySQL = `
      INSERT INTO storage.policies (id, name, definition, bucket_id)
      SELECT 
        gen_random_uuid(), 
        '${policyName.replace(/'/g, "''")}',
        '${JSON.stringify(definition).replace(/'/g, "''")}',
        '${bucketName.replace(/'/g, "''")}'
      WHERE NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE name = '${policyName.replace(/'/g, "''")}' 
        AND bucket_id = '${bucketName.replace(/'/g, "''")}'
      );
    `;
    
    console.log("Executing SQL to create policy:", policySQL.substring(0, 100) + "...");
    const { success, error } = await executeSQL(policySQL);
    
    if (!success) {
      console.error("Failed to create storage policy:", error);
      return { data: null, error };
    }
    
    console.log("Storage policy created or already exists:", policyName);
    return { 
      data: { name: policyName, bucket_id: bucketName }, 
      error: null 
    };
  } catch (error) {
    console.error("Exception in createStoragePolicy:", error);
    return { data: null, error };
  }
}
