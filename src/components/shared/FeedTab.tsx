
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Post } from "@/components/shared/Post";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Post as PostType } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function FeedTab() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recent");

  const fetchPosts = async (filter: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            user_type
          )
        `);

      // Apply filters
      if (filter === "following" && user) {
        // This gets posts from users that the current user follows
        const { data: followingIds, error: followingError } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', user.id);

        if (followingError) {
          console.error("Error fetching following:", followingError);
          setIsLoading(false);
          return;
        }

        if (followingIds && followingIds.length > 0) {
          const ids = followingIds.map(f => f.following_id);
          query = query.in('user_id', ids);
        } else {
          // No followings, return empty array
          setPosts([]);
          setIsLoading(false);
          return;
        }
      }

      // Add ordering based on filter
      if (filter === "recent") {
        query = query.order('created_at', { ascending: false });
      } else if (filter === "popular") {
        query = query.order('likes', { ascending: false });
      }

      // Limit to 50 posts
      query = query.limit(50);

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching posts:", error);
        return;
      }

      setPosts(data || []);
    } catch (error) {
      console.error("Error in fetchPosts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(activeTab);
  }, [activeTab, user]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleHashtagClick = (tag: string) => {
    // Implementation for hashtag filtering would go here
    console.log(`Clicked on hashtag: ${tag}`);
  };

  return (
    <Tabs defaultValue="recent" onValueChange={handleTabChange}>
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="recent">Recent</TabsTrigger>
        <TabsTrigger value="popular">Popular</TabsTrigger>
        <TabsTrigger value="following" disabled={!user}>Following</TabsTrigger>
      </TabsList>
      
      <TabsContent value="recent" className="space-y-6">
        {isLoading ? (
          Array(3)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
                <Skeleton className="h-[125px] w-full rounded-md" />
              </div>
            ))
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <Post
              key={post.id}
              id={post.id}
              author={{
                id: post.user_id,
                name: post.profiles?.name || "Unknown User",
                role: post.profiles?.user_type || "User",
                avatar: "/placeholder.svg",
              }}
              content={post.content}
              timestamp={new Date(post.created_at).toLocaleString()}
              likes={post.likes}
              comments={post.comments_count}
              hashtags={post.hashtags}
              image_url={post.image_url}
              onHashtagClick={handleHashtagClick}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-4">Be the first to share something!</p>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="popular" className="space-y-6">
        {isLoading ? (
          Array(3)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
                <Skeleton className="h-[125px] w-full rounded-md" />
              </div>
            ))
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <Post
              key={post.id}
              id={post.id}
              author={{
                id: post.user_id,
                name: post.profiles?.name || "Unknown User",
                role: post.profiles?.user_type || "User",
                avatar: "/placeholder.svg",
              }}
              content={post.content}
              timestamp={new Date(post.created_at).toLocaleString()}
              likes={post.likes}
              comments={post.comments_count}
              hashtags={post.hashtags}
              image_url={post.image_url}
              onHashtagClick={handleHashtagClick}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">No popular posts</h3>
            <p className="text-muted-foreground mb-4">Check back later for popular content</p>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="following" className="space-y-6">
        {!user ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">Sign in to see posts from users you follow</h3>
            <p className="text-muted-foreground mb-4">Create an account or log in to follow users and see their posts</p>
          </div>
        ) : isLoading ? (
          Array(3)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
                <Skeleton className="h-[125px] w-full rounded-md" />
              </div>
            ))
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <Post
              key={post.id}
              id={post.id}
              author={{
                id: post.user_id,
                name: post.profiles?.name || "Unknown User",
                role: post.profiles?.user_type || "User",
                avatar: "/placeholder.svg",
              }}
              content={post.content}
              timestamp={new Date(post.created_at).toLocaleString()}
              likes={post.likes}
              comments={post.comments_count}
              hashtags={post.hashtags}
              image_url={post.image_url}
              onHashtagClick={handleHashtagClick}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">No posts from people you follow</h3>
            <p className="text-muted-foreground mb-4">Follow more users to see their posts here</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
