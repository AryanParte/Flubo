
import { useEffect, useState, useRef, useCallback } from 'react';
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
  const callbackRef = useRef(callback);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscriptionIdRef = useRef<string>(`${table}_${Math.random().toString(36).substring(2, 9)}`);

  // Update the callback ref when the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const createChannelIfNeeded = useCallback(() => {
    if (channelRef.current) return;
    
    // Create a unique channel name with a stable ID that won't change on re-renders
    const channelName = `public:${table}:${subscriptionIdRef.current}`;
    console.log(`Creating realtime channel: ${channelName}`);
    
    const newChannel = supabase.channel(channelName);
    channelRef.current = newChannel;

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
          if (callbackRef.current) {
            callbackRef.current({
              new: payload.new as T,
              old: payload.old as T,
              eventType: event
            });
          }
        }
      );
    });

    // Subscribe to the channel with better logging and reconnection logic
    newChannel.subscribe((status) => {
      console.log(`Realtime subscription status for ${table} (${subscriptionIdRef.current}):`, status);
      
      if (status === 'TIMED_OUT') {
        console.log(`Subscription timed out for ${table}, reconnecting...`);
        // Attempt to resubscribe after timeout
        setTimeout(() => {
          if (channelRef.current === newChannel) {
            newChannel.subscribe();
          }
        }, 2000);
      }
      
      if (status === 'CHANNEL_ERROR') {
        console.error(`Channel error for ${table}`);
        
        // Attempt to recreate channel after error
        setTimeout(() => {
          if (channelRef.current === newChannel) {
            console.log(`Attempting to reconnect channel for ${table}`);
            supabase.removeChannel(newChannel);
            channelRef.current = null;
            createChannelIfNeeded();
          }
        }, 5000);
      }
    });
    
    setChannel(newChannel);
  }, [table, events, filter]);

  useEffect(() => {
    createChannelIfNeeded();

    // Improved cleanup on unmount
    return () => {
      console.log(`Removing realtime channel for ${table} (${subscriptionIdRef.current})`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, createChannelIfNeeded]);

  return channel;
}
