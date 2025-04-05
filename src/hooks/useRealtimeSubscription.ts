import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  // Update the callback ref when the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Function to retry connecting in case of failures
  const retryConnection = useCallback(() => {
    if (retryCountRef.current < maxRetries) {
      const delay = Math.min(1000 * 2 ** retryCountRef.current, 10000); // Exponential backoff
      console.log(`Retrying connection for ${table} in ${delay}ms (retry ${retryCountRef.current + 1}/${maxRetries})`);
      
      setTimeout(() => {
        retryCountRef.current++;
        
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        
        createChannelIfNeeded();
      }, delay);
    } else {
      console.warn(`Max retries (${maxRetries}) reached for ${table} subscription`);
    }
  }, [table]);

  const createChannelIfNeeded = useCallback(() => {
    if (channelRef.current) return channelRef.current;
    
    // Create a unique channel name with a stable ID that won't change on re-renders
    const channelName = `public:${table}:${subscriptionIdRef.current}`;
    console.log(`Creating realtime channel: ${channelName}`);
    
    try {
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
              try {
                callbackRef.current({
                  new: payload.new as T,
                  old: payload.old as T,
                  eventType: event
                });
              } catch (error) {
                console.error(`Error in realtime callback for ${table}:`, error);
              }
            }
          }
        );
      });

      // Subscribe to the channel with better logging and reconnection logic
      newChannel.subscribe((status) => {
        console.log(`Realtime subscription status for ${table} (${subscriptionIdRef.current}):`, status);
        
        if (status === 'TIMED_OUT') {
          console.log(`Subscription timed out for ${table}, reconnecting...`);
          retryConnection();
        }
        
        if (status === 'CHANNEL_ERROR') {
          console.error(`Channel error for ${table}`);
          retryConnection();
        }
        
        if (status === 'SUBSCRIBED') {
          // Reset retry count when connection is successful
          retryCountRef.current = 0;
        }
      });
      
      setChannel(newChannel);
      return newChannel;
    } catch (error) {
      console.error(`Error creating channel for ${table}:`, error);
      retryConnection();
      return null;
    }
  }, [table, events, filter, retryConnection]);

  useEffect(() => {
    const currentChannel = createChannelIfNeeded();

    // Heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (channelRef.current && channelRef.current.state !== 'SUBSCRIBED') {
        console.log(`Channel for ${table} is ${channelRef.current.state}, attempting reconnect...`);
        retryConnection();
      }
    }, 30000); // Check every 30 seconds

    // Improved cleanup on unmount
    return () => {
      clearInterval(heartbeatInterval);
      console.log(`Removing realtime channel for ${table} (${subscriptionIdRef.current})`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, createChannelIfNeeded, retryConnection]);

  return channel;
}
