import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Loader2, SendHorizontal } from "lucide-react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_profile?: {
    id: string;
    name: string | null;
    user_type: string | null;
  } | null;
};

interface PostCommentsProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
}

export function PostComments({ postId, onCommentCountChange }: PostCommentsProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchComments = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching comments for post:', postId);
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          post_id,
          user_id,
          content,
          created_at
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error("Error fetching comments:", error);
        throw error;
      }
      
      if (data) {
        console.log('Fetched comments:', data);
        
        const commentsWithProfiles = await Promise.all(
          data.map(async (comment) => {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, name, user_type')
              .eq('id', comment.user_id)
              .single();
              
            if (profileError) {
              console.error("Error fetching profile for comment:", profileError);
              return {
                ...comment,
                user_profile: null
              };
            }
            
            return {
              ...comment,
              user_profile: profileData
            };
          })
        );
        
        setComments(commentsWithProfiles as Comment[]);
        if (onCommentCountChange) {
          onCommentCountChange(commentsWithProfiles.length);
        }
        
        updatePostCommentCount(commentsWithProfiles.length);
      }
    } catch (error) {
      console.error("Error in fetchComments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchComments();
  }, [postId]);
  
  const updatePostCommentCount = async (count: number) => {
    try {
      console.log(`Updating post ${postId} comment count to ${count}`);
      const { error } = await supabase
        .from('posts')
        .update({ comments_count: count })
        .eq('id', postId);
      
      if (error) {
        console.error("Error updating comment count:", error);
      }
    } catch (error) {
      console.error("Error in updatePostCommentCount:", error);
    }
  };
  
  useRealtimeSubscription<Comment>(
    'comments',
    ['INSERT', 'UPDATE', 'DELETE'],
    (payload) => {
      console.log('Received comment update:', payload);
      
      if (payload.eventType === 'INSERT' && payload.new.post_id === postId) {
        const fetchNewComment = async () => {
          const { data: commentData, error: commentError } = await supabase
            .from('comments')
            .select(`
              id,
              post_id,
              user_id,
              content,
              created_at
            `)
            .eq('id', payload.new.id)
            .single();
            
          if (commentError) {
            console.error("Error fetching new comment:", commentError);
            return;
          }
          
          if (commentData) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, name, user_type')
              .eq('id', commentData.user_id)
              .single();
              
            const newCommentWithProfile = {
              ...commentData,
              user_profile: profileError ? null : profileData
            };
            
            console.log('Adding new comment to state with profile:', newCommentWithProfile);
            const updatedComments = [...comments, newCommentWithProfile as Comment];
            setComments(updatedComments);
            
            if (onCommentCountChange) {
              onCommentCountChange(updatedComments.length);
            }
            
            if (payload.new.user_id !== user?.id) {
              updatePostCommentCount(updatedComments.length);
            }
          }
        };
        
        fetchNewComment();
      } else if (payload.eventType === 'UPDATE' && payload.new.post_id === postId) {
        const updatedComments = comments.map(comment => 
          comment.id === payload.new.id ? { ...comment, ...payload.new } : comment
        );
        setComments(updatedComments);
      } else if (payload.eventType === 'DELETE' && payload.old.post_id === postId) {
        const updatedComments = comments.filter(comment => comment.id !== payload.old.id);
        setComments(updatedComments);
        
        if (onCommentCountChange) {
          onCommentCountChange(updatedComments.length);
        }
        
        updatePostCommentCount(updatedComments.length);
      }
    },
    `post_id=eq.${postId}`
  );

  useRealtimeSubscription(
    'posts',
    ['UPDATE'],
    (payload: any) => {
      console.log('Received posts update:', payload);
      if (payload.new?.id === postId && 
          payload.new?.comments_count !== undefined && 
          comments.length !== payload.new.comments_count) {
        console.log('Post comments count changed, refetching comments');
        fetchComments();
      }
    }
  );

  async function handleAddComment() {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment on posts",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Adding comment for post:', postId, 'user:', user.id, 'content:', newComment);
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        })
        .select();

      if (error) {
        console.error("Error posting comment:", error);
        throw error;
      }

      console.log('Comment added successfully:', data);
      
      setNewComment('');
      
      if (data && data[0]) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, user_type')
          .eq('id', user.id)
          .single();
          
        const newCommentWithProfile = {
          ...data[0],
          user_profile: profileError ? null : profileData
        };
        
        const updatedComments = [...comments, newCommentWithProfile as Comment];
        setComments(updatedComments);
        
        if (onCommentCountChange) {
          onCommentCountChange(updatedComments.length);
        }
        
        await updatePostCommentCount(updatedComments.length);
      }
      
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: "Failed to post your comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatRelativeTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
    
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  }

  return (
    <div className="space-y-4 mt-4">
      <h3 className="font-medium text-sm">{comments.length || 0} Comments</h3>
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>
                      {comment.user_profile?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium">{comment.user_profile?.name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">{formatRelativeTime(comment.created_at)}</p>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-2">No comments yet. Be the first to comment!</p>
          )}
        </>
      )}
      
      {user && (
        <div className="flex space-x-3 pt-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url || undefined} />
            <AvatarFallback>{user.user_metadata?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex space-x-2">
            <Textarea
              placeholder="Write a comment..."
              className="min-h-[80px] resize-none"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button 
              onClick={handleAddComment} 
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
              className="self-end"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
