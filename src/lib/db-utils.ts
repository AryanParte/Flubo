
import { supabase } from "./supabase";

export async function ensureSupabaseFunction(functionName: string): Promise<boolean> {
  try {
    // Check if the function exists by trying to call it with a simple query
    // Use the any type to bypass TypeScript's strict checking
    const { error } = await (supabase.rpc as any)(functionName, { sql: 'SELECT 1' });
    
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      // Function doesn't exist, create it
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION ${functionName}(sql text) 
        RETURNS void 
        LANGUAGE plpgsql 
        SECURITY DEFINER 
        AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$;
      `;
      
      // Execute SQL to create the function
      // Use the any type to bypass TypeScript's strict checking
      const { error: createError } = await (supabase.rpc as any)('exec_sql', { sql: createFunctionSQL });
      
      if (createError) {
        console.error(`Error creating ${functionName} function:`, createError);
        return false;
      }
      
      return true;
    } else if (error) {
      // Some other error occurred
      console.error(`Error checking ${functionName} function:`, error);
      return false;
    }
    
    // Function exists
    return true;
  } catch (err) {
    console.error(`Error in ensureSupabaseFunction for ${functionName}:`, err);
    return false;
  }
}

export async function executeSQL(sql: string): Promise<{ success: boolean, error?: any }> {
  try {
    // First ensure the exec_sql function exists
    const functionExists = await ensureSupabaseFunction('exec_sql');
    
    if (!functionExists) {
      return {
        success: false,
        error: "Could not create or verify the exec_sql function"
      };
    }
    
    // Execute the SQL
    // Use the any type to bypass TypeScript's strict checking
    const { error } = await (supabase.rpc as any)('exec_sql', { sql });
    
    if (error) {
      return {
        success: false,
        error
      };
    }
    
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err
    };
  }
}
