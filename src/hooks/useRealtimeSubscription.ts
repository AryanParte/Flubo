
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type SubscriptionEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export function useRealtimeSubscription<T>(
  table: string,
  events: SubscriptionEvent[] = ['INSERT', 'UPDATE', 'DELETE'],
  callback?: (payload: { new: T; old: T; eventType: SubscriptionEvent }) => void,
  filter?: string
) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create a unique channel name to avoid conflicts
    const channelName = `public:${table}${filter ? `:${filter}` : ''}:${Math.random().toString(36).substring(2, 15)}`;
    console.log(`Creating realtime channel: ${channelName}`);
    const newChannel = supabase.channel(channelName);

    // Subscribe to events with better error handling
    events.forEach(event => {
      newChannel.on(
        'postgres_changes' as any,
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

    // Subscribe to the channel with better logging
    newChannel.subscribe((status) => {
      console.log(`Realtime subscription status for ${table}:`, status);
      
      if (status === 'TIMED_OUT') {
        console.log(`Subscription timed out for ${table}, reconnecting...`);
        // Attempt to resubscribe after timeout
        setTimeout(() => {
          newChannel.subscribe();
        }, 2000);
      }
      
      if (status === 'CHANNEL_ERROR') {
        console.error(`Channel error for ${table}`);
      }
    });
    
    setChannel(newChannel);

    // Improved cleanup on unmount
    return () => {
      if (newChannel) {
        console.log(`Removing realtime channel for ${table}`);
        supabase.removeChannel(newChannel);
      }
    };
  }, [table, events, callback, filter]);

  return channel;
}
