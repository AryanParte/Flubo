
import { useState, useEffect } from 'react';
import { PostgrestError } from '@supabase/supabase-js';

export type SupabaseQueryResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

/**
 * A hook to handle Supabase queries with proper error handling and loading states
 */
export function useSupabaseQuery<T>(
  queryFn: () => Promise<SupabaseQueryResult<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await queryFn();
        
        if (result.error) {
          setError(result.error);
          setData(null);
        } else {
          setData(result.data);
          setError(null);
        }
      } catch (err) {
        console.error('Error in useSupabaseQuery:', err);
        setError(err as PostgrestError);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, error, loading, isError: error !== null };
}
