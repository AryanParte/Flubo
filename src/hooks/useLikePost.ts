
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';

type LikeStatus = {
  isLiked: boolean;
  likesCount: number;
  toggleLike: () => Promise<void>;
  isLoading: boolean;
};

export function useLikePost(postId: string, initialLikesCount: number): LikeStatus {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(initialLikesCount);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Check if post is already liked by this user
  useState(() => {
    const checkLikeStatus = async () => {
      if (!user) return;
      
      try {
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
        
        setIsLiked(!!data);
      } catch (error) {
        console.error("Error in checkLikeStatus:", error);
      }
    };
    
    checkLikeStatus();
  }, [postId, user]);
  
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
      if (isLiked) {
        // Remove like
        const { error: deleteLikeError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
          
        if (deleteLikeError) {
          console.error("Error removing like:", deleteLikeError);
          throw deleteLikeError;
        }
        
        // Update post likes count
        const { error: updatePostError } = await supabase
          .from('posts')
          .update({ likes: likesCount - 1 })
          .eq('id', postId);
          
        if (updatePostError) {
          console.error("Error updating post likes count:", updatePostError);
          throw updatePostError;
        }
        
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        // Add like
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
        
        // Update post likes count
        const { error: updatePostError } = await supabase
          .from('posts')
          .update({ likes: likesCount + 1 })
          .eq('id', postId);
          
        if (updatePostError) {
          console.error("Error updating post likes count:", updatePostError);
          throw updatePostError;
        }
        
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
