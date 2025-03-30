
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
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLikePost } from "@/hooks/useLikePost";
import { PostComments } from "./PostComments";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

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
  onHashtagClick 
}: PostProps) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(initialComments);
  const { isLiked, likesCount, toggleLike, isLoading } = useLikePost(id, likes);
  
  // Fetch actual comment count when component mounts
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
            
            // Update the post's comments_count in database if it's different
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
  
  // Handle comment box toggle
  const handleCommentToggle = () => {
    setShowComments(!showComments);
  };
  
  const handleSharePost = () => {
    // Copy post URL to clipboard
    navigator.clipboard.writeText(`${window.location.origin}/post/${id}`).then(() => {
      toast({
        title: "Link copied",
        description: "Post link copied to clipboard",
      });
    });
  };
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div className="flex space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{author.name}</p>
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
        <div className="mt-3">
          <img 
            src={image_url} 
            alt="Post attachment" 
            className="rounded-md max-h-96 object-cover w-full" 
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
    </Card>
  );
}
