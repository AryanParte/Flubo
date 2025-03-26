
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
  profiles?: {
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
  
  // Fetch initial comments
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
          created_at,
          profiles (
            id,
            name,
            user_type
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error("Error fetching comments:", error);
        throw error;
      }
      
      if (data) {
        console.log('Fetched comments:', data);
        setComments(data as Comment[]);
        if (onCommentCountChange) {
          onCommentCountChange(data.length);
        }
      }
    } catch (error) {
      console.error("Error in fetchComments:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchComments();
  }, [postId]);
  
  // Setup realtime subscription for comments
  useRealtimeSubscription<Comment>(
    'comments',
    ['INSERT', 'UPDATE', 'DELETE'],
    (payload) => {
      console.log('Received comment update:', payload);
      if (payload.eventType === 'INSERT' && payload.new.post_id === postId) {
        // Add new comment to state
        console.log('Adding new comment to state:', payload.new);
        setComments(prev => [...prev, payload.new]);
        if (onCommentCountChange) {
          onCommentCountChange(comments.length + 1);
        }
      } else if (payload.eventType === 'UPDATE' && payload.new.post_id === postId) {
        // Update existing comment
        console.log('Updating existing comment:', payload.new);
        setComments(prev => 
          prev.map(comment => comment.id === payload.new.id ? payload.new : comment)
        );
      } else if (payload.eventType === 'DELETE' && payload.old.post_id === postId) {
        // Remove deleted comment
        console.log('Removing deleted comment:', payload.old);
        setComments(prev => prev.filter(comment => comment.id !== payload.old.id));
        if (onCommentCountChange) {
          onCommentCountChange(comments.length - 1);
        }
      }
    },
    `post_id=eq.${postId}`
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
      // No need to manually update the UI since we have realtime subscription

      setNewComment('');
      
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
                      {comment.profiles?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium">{comment.profiles?.name || 'Anonymous'}</p>
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
