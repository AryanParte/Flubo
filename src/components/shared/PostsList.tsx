import { useState, useEffect } from "react";
import { Post } from "@/components/shared/Post";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Post as PostType } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface PostsListProps {
  userId: string;
}

export function PostsList({ userId }: PostsListProps) {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserPosts();
    }
  }, [userId]);

  const fetchUserPosts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Define a more specific type for the query result
      type PostWithProfile = PostType & {
        profiles: {
          id: string;
          name: string | null;
          user_type: string;
          company: string | null;
        } | null;
      };

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            user_type,
            company
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching user posts:", error);
        setError("Failed to load posts");
        setIsLoading(false);
        return;
      }

      // Cast the data to the more specific type
      const typedData = data as PostWithProfile[];
      setPosts(typedData || []);
    } catch (error) {
      console.error("Error in fetchUserPosts:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  const handleHashtagClick = (tag: string) => {
    console.log(`Clicked on hashtag: ${tag}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array(3)
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
          ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <div className="text-destructive mb-2">Error loading posts</div>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.length > 0 ? (
        posts.map((post) => (
          <Post
            key={post.id}
            id={post.id}
            author={{
              id: post.user_id,
              name: post.profiles?.name || "Unknown User",
              role: post.profiles?.user_type || "User",
              company: post.profiles?.company || null,
              avatar: "/placeholder.svg",
            }}
            content={post.content}
            timestamp={new Date(post.created_at).toLocaleString()}
            likes={post.likes}
            comments={post.comments_count}
            hashtags={post.hashtags}
            image_url={post.image_url}
            onHashtagClick={handleHashtagClick}
            onPostDeleted={handlePostDeleted}
          />
        ))
      ) : (
        <div className="text-center py-8 border border-border rounded-lg bg-card/50">
          <h3 className="text-lg font-medium mb-2">No posts yet</h3>
          <p className="text-muted-foreground">This user hasn't created any posts.</p>
        </div>
      )}
    </div>
  );
} 