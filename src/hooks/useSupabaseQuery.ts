
import { useState, useEffect } from 'react';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * A hook to handle Supabase queries with proper error handling and loading states
 */
export function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await queryFn();
        
        if (error) {
          setError(error);
          setData(null);
        } else {
          setData(data);
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
