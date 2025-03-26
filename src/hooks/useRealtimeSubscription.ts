
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
    const channelName = `public:${table}${filter ? `:${filter}` : ''}`;
    console.log(`Creating realtime channel: ${channelName}`);
    const newChannel = supabase.channel(channelName);

    // Subscribe to events
    events.forEach(event => {
      // Need to use any type here because of Supabase's API typing limitations
      // @ts-ignore - The Supabase types don't match the actual API functionality
      newChannel.on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          ...(filter && { filter })
        },
        (payload: any) => {
          console.log(`Realtime ${event} event for ${table}:`, payload);
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
    newChannel.subscribe((status) => {
      console.log(`Realtime subscription status for ${table}:`, status);
    });
    
    setChannel(newChannel);

    // Cleanup on unmount
    return () => {
      if (newChannel) {
        console.log(`Removing realtime channel for ${table}`);
        supabase.removeChannel(newChannel);
      }
    };
  }, [table, events, callback, filter]);

  return channel;
}
