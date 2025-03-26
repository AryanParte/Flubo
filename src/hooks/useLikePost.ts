
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { useRealtimeSubscription } from './useRealtimeSubscription';

type LikeStatus = {
  isLiked: boolean;
  likesCount: number;
  toggleLike: () => Promise<void>;
  isLoading: boolean;
};

type PostLike = {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
};

export function useLikePost(postId: string, initialLikesCount: number): LikeStatus {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(initialLikesCount);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Listen to real-time updates for post likes
  useRealtimeSubscription<PostLike>(
    'post_likes',
    ['INSERT', 'DELETE'],
    (payload) => {
      console.log('Received post_likes update:', payload);
      if (payload.new?.post_id === postId || payload.old?.post_id === postId) {
        // Refresh like status if the update is for the current post
        if (user) {
          checkLikeStatus();
        }
        
        // Update likes count based on the event type
        if (payload.eventType === 'INSERT') {
          console.log('Incrementing likes count due to INSERT event');
          setLikesCount(prevCount => prevCount + 1);
        } else if (payload.eventType === 'DELETE') {
          console.log('Decrementing likes count due to DELETE event');
          setLikesCount(prevCount => Math.max(0, prevCount - 1));
        }
      }
    },
    `post_id=eq.${postId}`
  );
  
  // Check if post is already liked by this user
  const checkLikeStatus = async () => {
    if (!user) return;
    
    try {
      console.log('Checking like status for post:', postId, 'user:', user.id);
      const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
        console.error("Error checking like status:", error);
        return;
      }
      
      const liked = !!data;
      console.log('Post is liked:', liked);
      setIsLiked(liked);
    } catch (error) {
      console.error("Error in checkLikeStatus:", error);
    }
  };
  
  // Initial check for like status
  useEffect(() => {
    if (user) {
      checkLikeStatus();
    } else {
      setIsLiked(false);
    }
  }, [postId, user]);
  
  // Also update the likes count based on initial prop update
  useEffect(() => {
    setLikesCount(initialLikesCount);
  }, [initialLikesCount]);
  
  const toggleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Current like status:', isLiked);
      if (isLiked) {
        // Remove like
        console.log('Removing like for post:', postId, 'user:', user.id);
        const { error: deleteLikeError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
          
        if (deleteLikeError) {
          console.error("Error removing like:", deleteLikeError);
          throw deleteLikeError;
        }
        
        console.log('Like removed successfully');
        // Local update for immediate UI feedback
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Add like
        console.log('Adding like for post:', postId, 'user:', user.id);
        const { error: addLikeError } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });
          
        if (addLikeError) {
          console.error("Error adding like:", addLikeError);
          throw addLikeError;
        }
        
        console.log('Like added successfully');
        // Local update for immediate UI feedback
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return { isLiked, likesCount, toggleLike, isLoading };
}
