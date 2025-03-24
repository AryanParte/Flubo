
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Image, MessageSquare, ThumbsUp, Share, MoreHorizontal, SendHorizontal, Loader2 } from "lucide-react";

export function FeedTab() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([
    {
      id: '1',
      author: {
        name: 'Jane Cooper',
        role: 'Investor | Founder of TechVentures',
        avatar: '/placeholder.svg'
      },
      content: 'Just met with an amazing fintech startup that\'s revolutionizing how small businesses access capital. Looking forward to potentially joining their journey! #VentureCapital #Fintech',
      timestamp: '2 hours ago',
      likes: 24,
      comments: 5,
      isLiked: false
    },
    {
      id: '2',
      author: {
        name: 'Alex Morgan',
        role: 'Business | CEO at GreenTech Solutions',
        avatar: '/placeholder.svg'
      },
      content: 'Excited to announce that we\'ve just closed our seed round! $1.5M to help us build the future of sustainable energy solutions. Thanks to all our investors who believed in our vision. #Funding #CleanTech #Startup',
      timestamp: '5 hours ago',
      likes: 88,
      comments: 12,
      isLiked: true
    },
    {
      id: '3',
      author: {
        name: 'Robert Chen',
        role: 'Investor | Partner at Blue Ventures',
        avatar: '/placeholder.svg'
      },
      content: 'What\'s the biggest challenge you\'re facing in raising your Series A? Share your experiences below, and I\'ll try to provide some insights from an investor\'s perspective. #StartupAdvice #VentureCapital',
      timestamp: '1 day ago',
      likes: 45,
      comments: 32,
      isLiked: false
    },
    {
      id: '4',
      author: {
        name: 'Maria Silva',
        role: 'Business | Founder of HealthAI',
        avatar: '/placeholder.svg'
      },
      content: 'Looking for technical co-founders with experience in ML and healthcare. We\'re building an AI platform to improve patient outcomes and reduce healthcare costs. DM if interested or can make introductions! #CoFounder #HealthTech #AI',
      timestamp: '2 days ago',
      likes: 19,
      comments: 8,
      isLiked: false
    }
  ]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPostingContent, setIsPostingContent] = useState(false);
  
  const handleLike = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const wasLiked = post.isLiked;
        return {
          ...post,
          likes: wasLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !wasLiked
        };
      }
      return post;
    }));
  };
  
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast({
        title: "Cannot create empty post",
        description: "Please add some content to your post",
        variant: "destructive",
      });
      return;
    }
    
    setIsPostingContent(true);
    
    try {
      // In a real implementation, this would save to Supabase
      // For now, we'll just add it to the local state
      
      const newPost = {
        id: Date.now().toString(),
        author: {
          name: user?.user_metadata?.name || 'Anonymous User',
          role: user?.user_metadata?.user_type === 'startup' ? 'Business' : 'Investor',
          avatar: '/placeholder.svg'
        },
        content: newPostContent,
        timestamp: 'Just now',
        likes: 0,
        comments: 0,
        isLiked: false
      };
      
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      
      toast({
        title: "Post created",
        description: "Your post has been published to the feed",
      });
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error creating post",
        description: "There was an error publishing your post",
        variant: "destructive",
      });
    } finally {
      setIsPostingContent(false);
    }
  };
  
  return (
    <div className="flex flex-col space-y-6">
      {/* Create Post Card */}
      <Card className="p-4">
        <div className="flex space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {user?.user_metadata?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Share an update, announcement, or ask a question..."
              className="min-h-[80px] resize-none"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Image className="h-4 w-4 mr-2" />
                  Photo
                </Button>
              </div>
              <Button 
                onClick={handleCreatePost} 
                disabled={!newPostContent.trim() || isPostingContent}
                size="sm"
              >
                {isPostingContent ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <SendHorizontal className="h-4 w-4 mr-2" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Feed */}
      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="space-y-4 pr-4">
          {posts.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.author.avatar} alt={post.author.name} />
                    <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{post.author.name}</p>
                    <p className="text-sm text-muted-foreground">{post.author.role}</p>
                    <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-3">
                <p className="text-sm whitespace-pre-wrap">{post.content}</p>
              </div>
              
              <Separator className="my-3" />
              
              <div className="flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={post.isLiked ? "text-accent" : ""}
                  onClick={() => handleLike(post.id)}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  {post.likes}
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {post.comments}
                </Button>
                <Button variant="ghost" size="sm">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
