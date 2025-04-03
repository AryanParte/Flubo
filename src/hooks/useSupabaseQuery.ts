
import { useState, useEffect } from 'react';
import { PostgrestError } from '@supabase/supabase-js';

export type SupabaseQueryResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

type QueryConfig<T> = {
  queryKey: string[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
};

/**
 * A hook to handle Supabase queries with proper error handling and loading states,
 * with an API similar to React Query for easier transition in the future
 */
export function useSupabaseQuery<T>(config: QueryConfig<T>) {
  const { queryKey, queryFn, enabled = true } = config;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!enabled) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const result = await queryFn();
        setData(result);
        setError(null);
      } catch (err: any) {
        console.error('Error in useSupabaseQuery:', err);
        setError(err as PostgrestError);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  // Using a stringified version of queryKey to avoid unnecessary re-renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, JSON.stringify(queryKey)]);

  return { 
    data, 
    error, 
    isLoading,
    isError: error !== null 
  };
}
