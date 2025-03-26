
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type SubscriptionEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export function useRealtimeSubscription<T>(
  table: string,
  events: SubscriptionEvent[] = ['INSERT', 'UPDATE', 'DELETE'],
  callback?: (payload: { new: T; old: T; eventType: SubscriptionEvent }) => void,
  filter?: string
) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create a channel for the table
    const newChannel = supabase.channel(`public:${table}${filter ? `:${filter}` : ''}`);

    // Subscribe to events
    events.forEach(event => {
      newChannel.on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          ...(filter && { filter })
        },
        payload => {
          if (callback) {
            callback({
              new: payload.new as T,
              old: payload.old as T,
              eventType: event
            });
          }
        }
      );
    });

    // Subscribe to the channel
    newChannel.subscribe();
    setChannel(newChannel);

    // Cleanup on unmount
    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [table, events, callback, filter]);

  return channel;
}
