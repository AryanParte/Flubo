
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Post } from "./Post";
import { useAuth } from "@/context/AuthContext";
import { SharePostDialog } from "./SharePostDialog";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";

// Define types for our post structure
type PostAuthor = {
  id: string;
  name: string;
  avatar_url: string | null;
  verified: boolean;
};

type PostData = {
  id: string;
  content: string;
  created_at: string;
  author: PostAuthor;
  likes: number;
  comments: number;
  user_has_liked: boolean;
  image_url?: string | null;
  hashtags?: string[];
};

export const FeedTab = () => {
  const { user } = useAuth();
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [feedTab, setFeedTab] = useState<"following" | "trending" | "for-you">("for-you");
  
  React.useEffect(() => {
    const fetchFeedData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch posts based on selected tab
        let query = supabase
          .from('posts')
          .select(`
            id, 
            content, 
            created_at, 
            likes, 
            comments_count, 
            image_url,
            hashtags,
            profiles:user_id (
              id, 
              name,
              verified
            )
          `)
          .order('created_at', { ascending: false });
        
        // Apply filtering based on the active tab
        if (feedTab === 'following') {
          // Get posts from users the current user is following
          const { data: followingData } = await supabase
            .from('followers')
            .select('following_id')
            .eq('follower_id', user.id);
          
          if (followingData && followingData.length > 0) {
            const followingIds = followingData.map(item => item.following_id);
            query = query.in('user_id', followingIds);
          } else {
            // If not following anyone, return empty array
            setPosts([]);
            setIsLoading(false);
            return;
          }
        } else if (feedTab === 'trending') {
          // Order by likes for trending
          query = query.order('likes', { ascending: false }).limit(20);
        }
        // For "for-you" tab, we'll just get recent posts without special filtering
        
        // Limit to reasonable amount for initial load
        if (feedTab !== 'trending') {
          query = query.limit(20);
        }
        
        const { data: postData, error: postsError } = await query;
        
        if (postsError) throw postsError;
        
        // Check if user has liked each post
        const postsWithLikes = await Promise.all((postData || []).map(async (post: any) => {
          const { data: likeData } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .maybeSingle();
          
          return {
            id: post.id,
            content: post.content,
            created_at: post.created_at,
            likes: post.likes,
            comments: post.comments_count, // Fixed: using comments_count from the query
            image_url: post.image_url,
            hashtags: post.hashtags,
            author: {
              id: post.profiles?.id || "",
              name: post.profiles?.name || "Unknown User",
              avatar_url: null, // We don't have avatar URLs in the sample data
              verified: post.profiles?.verified || false
            },
            user_has_liked: !!likeData
          };
        }));
        
        setPosts(postsWithLikes);
      } catch (err: any) {
        console.error("Error fetching feed:", err);
        setError(err);
        toast({
          title: "Error loading feed",
          description: "Could not load feed posts at this time",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFeedData();
  }, [user, feedTab]);
  
  const handleHashtagClick = (tag: string) => {
    toast({
      title: "Hashtag clicked",
      description: `You clicked on #${tag}`
    });
    // In the future, this could filter posts by hashtag
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Latest Updates</h2>
        <button 
          onClick={() => setShowPostDialog(true)}
          className="text-sm font-medium text-accent hover:text-accent/80"
        >
          Create Post
        </button>
      </div>
      
      <Tabs value={feedTab} onValueChange={(value) => setFeedTab(value as typeof feedTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="for-you">For You</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>
        
        <TabsContent value={feedTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent mr-2" />
              <p>Loading feed...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>Error loading feed. Please try again later.</p>
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((postData) => (
                <Post 
                  key={postData.id}
                  id={postData.id}
                  author={{
                    id: postData.author.id,
                    name: postData.author.name,
                    role: postData.author.verified ? "Verified Business" : "Business",
                    avatar: postData.author.avatar_url || ""
                  }}
                  content={postData.content}
                  timestamp={new Date(postData.created_at).toLocaleString()}
                  likes={postData.likes}
                  comments={postData.comments}
                  hashtags={postData.hashtags}
                  image_url={postData.image_url}
                  onHashtagClick={handleHashtagClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              {feedTab === 'following' ? (
                <p className="text-muted-foreground">Follow users to see their posts here!</p>
              ) : (
                <p className="text-muted-foreground">No posts available. Create a post or check back later!</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <SharePostDialog isOpen={showPostDialog} onClose={() => setShowPostDialog(false)} />
    </div>
  );
};
