
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
  const [status, setStatus] = useState<string | null>(null);
  const callbackRef = useRef(callback);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY_MS = 2000;
  const subscriptionIdRef = useRef<string>(`${table}_${Math.random().toString(36).substring(2, 9)}`);

  // Update the callback ref when the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const createChannel = useCallback(() => {
    if (channelRef.current) {
      console.log(`Removing existing channel for ${table}`);
      try {
        supabase.removeChannel(channelRef.current);
      } catch (e) {
        console.error(`Error removing channel for ${table}:`, e);
      }
      channelRef.current = null;
    }
    
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
            try {
              callbackRef.current({
                new: payload.new as T,
                old: payload.old as T,
                eventType: event
              });
              
              console.log(`Successfully processed ${event} event for ${table}`);
            } catch (error) {
              console.error(`Error processing ${event} event for ${table}:`, error);
            }
          } else {
            console.warn(`Received ${event} event for ${table} but no callback is registered`);
          }
        }
      );
    });

    // Subscribe to the channel with better logging and reconnection logic
    newChannel.subscribe((status) => {
      console.log(`Realtime subscription status for ${table} (${subscriptionIdRef.current}):`, status);
      setStatus(status);
      
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Successfully subscribed to real-time updates for ${table}`);
        // Reset reconnect attempts on successful connection
        reconnectAttemptsRef.current = 0;
        
        // Clear any pending reconnect timeout
        if (reconnectTimeoutRef.current) {
          window.clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      }
      
      if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
        console.log(`Subscription ${status} for ${table}, attempting to reconnect...`);
        
        // Clear any existing timeout
        if (reconnectTimeoutRef.current) {
          window.clearTimeout(reconnectTimeoutRef.current);
        }
        
        // Check if we've exceeded max reconnect attempts
        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.error(`Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached for ${table}.`);
          return;
        }
        
        // Increment the reconnect attempts counter
        reconnectAttemptsRef.current += 1;
        
        // Attempt to resubscribe after timeout with exponential backoff
        const delay = RECONNECT_DELAY_MS * Math.pow(1.5, reconnectAttemptsRef.current - 1);
        console.log(`Attempting reconnect #${reconnectAttemptsRef.current} in ${delay}ms`);
        
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log(`Executing reconnect attempt #${reconnectAttemptsRef.current} for ${table}`);
          if (channelRef.current === newChannel) {
            console.log(`Recreating channel for ${table} after connection issue`);
            createChannel();
          }
        }, delay);
      }
    });
    
    setChannel(newChannel);
    return newChannel;
  }, [table, events, filter]);

  useEffect(() => {
    const channel = createChannel();

    // Clean up on unmount
    return () => {
      console.log(`Removing realtime channel for ${table} (${subscriptionIdRef.current})`);
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (e) {
          console.error(`Error removing channel for ${table}:`, e);
        }
        channelRef.current = null;
      }
    };
  }, [table, createChannel]);

  return { channel, status };
}
