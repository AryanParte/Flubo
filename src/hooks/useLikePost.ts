
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
        // Update likes count based on the event type
        if (payload.eventType === 'INSERT') {
          console.log('Incrementing likes count due to INSERT event');
          setLikesCount(prevCount => prevCount + 1);
          
          // Update isLiked if the current user is the one who liked
          if (user && payload.new?.user_id === user.id) {
            setIsLiked(true);
          }
        } else if (payload.eventType === 'DELETE') {
          console.log('Decrementing likes count due to DELETE event');
          setLikesCount(prevCount => Math.max(0, prevCount - 1));
          
          // Update isLiked if the current user is the one who unliked
          if (user && payload.old?.user_id === user.id) {
            setIsLiked(false);
          }
        }
      }
    },
    `post_id=eq.${postId}`
  );
  
  // Also listen to updates on the post itself for like count changes
  useRealtimeSubscription(
    'posts',
    ['UPDATE'],
    (payload: any) => {
      console.log('Received posts update:', payload);
      if (payload.new?.id === postId && payload.new?.likes !== undefined) {
        console.log('Updating like count from post update:', payload.new.likes);
        setLikesCount(payload.new.likes);
      }
    }
  );
  
  // Fetch actual post likes count and check like status
  const fetchLikesData = async () => {
    try {
      // Get accurate like count
      const { count: likesCount, error: countError } = await supabase
        .from('post_likes')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', postId);
        
      if (countError) {
        console.error("Error fetching likes count:", countError);
      } else if (likesCount !== null) {
        console.log('Fetched likes count:', likesCount);
        setLikesCount(likesCount);
        
        // Update post likes count in database if it's different
        if (likesCount !== initialLikesCount) {
          await supabase
            .from('posts')
            .update({ likes: likesCount })
            .eq('id', postId);
        }
      }
      
      // Check if current user has liked this post
      if (user) {
        const { data, error } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
          console.error("Error checking like status:", error);
        } else {
          const liked = !!data;
          console.log('Post is liked by current user:', liked);
          setIsLiked(liked);
        }
      }
    } catch (error) {
      console.error("Error in fetchLikesData:", error);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchLikesData();
  }, [postId, user, initialLikesCount]);
  
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
        
        // Update the post like count
        const newCount = Math.max(0, likesCount - 1);
        await supabase
          .from('posts')
          .update({ likes: newCount })
          .eq('id', postId);
          
        // Local update for immediate UI feedback
        setIsLiked(false);
        setLikesCount(newCount);
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
        
        // Update the post like count
        const newCount = likesCount + 1;
        await supabase
          .from('posts')
          .update({ likes: newCount })
          .eq('id', postId);
          
        // Local update for immediate UI feedback
        setIsLiked(true);
        setLikesCount(newCount);
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
