
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2, Send } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { UserAvatar } from "./UserAvatar";

interface PostCommentsProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
}

export function PostComments({ postId, onCommentCountChange }: PostCommentsProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    fetchComments();
  }, [postId]);
  
  const fetchComments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      setComments(data || []);
      
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "You need to sign in to comment",
        variant: "destructive",
      });
      return;
    }
    
    if (!newComment.trim()) return;
    
    try {
      setSubmitting(true);
      
      // Add comment to database
      const { data, error } = await supabase
        .from('comments')
        .insert([
          { post_id: postId, user_id: user.id, content: newComment }
        ])
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (name, avatar_url)
        `);
        
      if (error) {
        throw error;
      }
      
      // Update post comment count
      await supabase.rpc('increment_comment_count', {
        post_id: postId,
        increment_by: 1
      });
      
      // Add the new comment to the comments list
      if (data && data[0]) {
        setComments([...comments, data[0]]);
      }
      
      // Clear input
      setNewComment("");
      
      // Update parent component with new count
      if (onCommentCountChange) {
        onCommentCountChange(comments.length + 1);
      }
      
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to post your comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="mt-4 pt-4">
      <Separator className="mb-4" />
      
      {loading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <UserAvatar 
                  userId={comment.user_id} 
                  avatarUrl={comment.profiles?.avatar_url} 
                  name={comment.profiles?.name || "User"}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{comment.profiles?.name || "Anonymous User"}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground text-sm">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      )}
      
      {user && (
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex gap-3">
            <UserAvatar 
              userId={user.id} 
              name="You"
              size="sm"
            />
            <div className="flex-1">
              <Textarea 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="resize-none min-h-[80px]"
              />
              <div className="flex justify-end mt-2">
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={!newComment.trim() || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
      
      {!user && (
        <div className="text-center mt-4 p-3 border border-dashed rounded-lg">
          <p className="text-muted-foreground text-sm">
            Sign in to add your comment
          </p>
        </div>
      )}
    </div>
  );
}
