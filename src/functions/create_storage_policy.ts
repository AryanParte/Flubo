
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
    
    // First ensure the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Failed to list buckets:", listError);
      return { data: null, error: listError };
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Bucket ${bucketName} doesn't exist, creating it...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true
      });
      
      if (createError) {
        console.error("Failed to create bucket:", createError);
        return { data: null, error: createError };
      }
      
      // Update bucket to be public
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true
      });
      
      if (updateError) {
        console.error("Failed to set bucket to public:", updateError);
      }
    }
    
    // Create policy using raw SQL through executeSQL with explicit id generation
    const policyDefinitionString = JSON.stringify(definition).replace(/'/g, "''");
    
    const policySQL = `
      INSERT INTO storage.policies (id, name, definition, bucket_id)
      SELECT 
        gen_random_uuid(), 
        '${policyName.replace(/'/g, "''")}',
        '${policyDefinitionString}',
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
