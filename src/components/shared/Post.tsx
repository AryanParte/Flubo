
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { 
  Image, 
  MessageSquare, 
  ThumbsUp, 
  Share, 
  MoreHorizontal, 
  Loader2,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLikePost } from "@/hooks/useLikePost";
import { PostComments } from "./PostComments";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { ProfilePreview } from "./ProfilePreview";
import { SharePostDialog } from "./SharePostDialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export type PostAuthor = {
  id: string;
  name: string;
  role: string;
  avatar: string;
};

export type PostProps = {
  id: string;
  author: PostAuthor;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  hashtags?: string[];
  image_url?: string | null;
  onHashtagClick?: (tag: string) => void;
  onPostDeleted?: (postId: string) => void;
};

export function Post({ 
  id, 
  author, 
  content, 
  timestamp, 
  likes, 
  comments: initialComments, 
  hashtags, 
  image_url,
  onHashtagClick,
  onPostDeleted
}: PostProps) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(initialComments);
  const { isLiked, likesCount, toggleLike, isLoading } = useLikePost(id, likes);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const isPostOwner = user && user.id === author.id;
  
  useEffect(() => {
    const fetchCommentCount = async () => {
      if (!showComments) {
        try {
          const { count, error } = await supabase
            .from('comments')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', id);
            
          if (error) {
            console.error("Error fetching comment count:", error);
            return;
          }
          
          if (count !== null && count !== commentsCount) {
            setCommentsCount(count);
            
            if (count !== initialComments) {
              await supabase
                .from('posts')
                .update({ comments_count: count })
                .eq('id', id);
            }
          }
        } catch (error) {
          console.error("Error in fetchCommentCount:", error);
        }
      }
    };
    
    fetchCommentCount();
  }, [id, initialComments]);
  
  const handleCommentToggle = () => {
    setShowComments(!showComments);
  };
  
  const handleSharePost = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to share posts",
        variant: "destructive",
      });
      return;
    }
    
    setShowShareDialog(true);
  };
  
  const handleDeletePost = async () => {
    if (!user || user.id !== author.id) {
      return;
    }
    
    setIsDeleting(true);
    try {
      // Delete post from Supabase
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Extra safety check to ensure user can only delete their own posts
      
      if (error) {
        throw error;
      }
      
      // Delete post image from storage if it exists
      if (image_url) {
        try {
          // Extract the file path from the URL
          const filePathMatch = image_url.match(/\/storage\/v1\/object\/public\/posts\/(.*)/);
          if (filePathMatch && filePathMatch[1]) {
            const filePath = decodeURIComponent(filePathMatch[1]);
            await supabase.storage.from('posts').remove([filePath]);
          }
        } catch (storageError) {
          console.error("Error removing post image:", storageError);
          // Continue with post deletion even if image removal fails
        }
      }
      
      // Notify parent component about the deletion
      if (onPostDeleted) {
        onPostDeleted(id);
      }
      
      setIsDeleted(true);
      
      toast({
        title: "Post deleted",
        description: "Your post has been successfully deleted"
      });
      
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // If post has been deleted, don't render anything
  if (isDeleted) {
    return null;
  }
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div className="flex space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <HoverCard>
              <HoverCardTrigger asChild>
                <p className="font-medium cursor-pointer hover:underline">{author.name}</p>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 p-0" align="start">
                <ProfilePreview userId={author.id} />
              </HoverCardContent>
            </HoverCard>
            <p className="text-sm text-muted-foreground">{author.role}</p>
            <p className="text-xs text-muted-foreground">{timestamp}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Save Post</DropdownMenuItem>
            <DropdownMenuItem>Follow {author.name}</DropdownMenuItem>
            <DropdownMenuItem>Report Post</DropdownMenuItem>
            
            {isPostOwner && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="mt-3">
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        
        {hashtags && hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {hashtags.map(tag => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-accent"
                onClick={() => onHashtagClick && onHashtagClick(tag)}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      {image_url && (
        <div className="mt-3 overflow-hidden rounded-md border border-border">
          <img 
            src={image_url} 
            alt="Post attachment" 
            className="w-full h-auto object-contain" 
          />
        </div>
      )}
      
      <Separator className="my-3" />
      
      <div className="flex justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className={isLiked ? "text-primary" : ""}
          onClick={toggleLike}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ThumbsUp className={`h-4 w-4 mr-2 ${isLiked ? "fill-primary" : ""}`} />
          )}
          {likesCount}
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleCommentToggle}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          {commentsCount}
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleSharePost}
        >
          <Share className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
      
      {showComments && (
        <PostComments 
          postId={id} 
          onCommentCountChange={setCommentsCount}
        />
      )}
      
      {showShareDialog && (
        <SharePostDialog
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          postId={id}
          postContent={content}
          postImage={image_url}
          postAuthor={{
            name: author.name,
            avatar: author.avatar
          }}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
