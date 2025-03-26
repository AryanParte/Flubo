
/**
 * Safely handles Supabase query responses by checking for errors first
 * @param response The response from a Supabase query
 * @param fallback Optional fallback value to return if the query has an error
 * @returns The data if successful, or the fallback value (null by default)
 */
export function safeQueryResult<T>(
  response: { data: T | null; error: any },
  fallback: T | null = null
): T | null {
  if (response.error) {
    console.error("Supabase query error:", response.error);
    return fallback;
  }
  return response.data;
}

/**
 * Type guard function to check if a value is not null
 */
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * Utility to safely handle DB query responses, especially for queries that use
 * relationships or joins where TypeScript might not correctly infer the result type
 */
export function processQueryResult<T>(
  queryResult: { data: any; error: any },
  transformer: (rawData: any) => T[]
): T[] {
  if (queryResult.error) {
    console.error("Supabase query error:", queryResult.error);
    return [];
  }
  
  try {
    return transformer(queryResult.data || []);
  } catch (e) {
    console.error("Error transforming query result:", e);
    return [];
  }
}
