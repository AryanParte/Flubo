
import React from "react";
import { Loader2 } from "lucide-react";
import { Post } from "./Post";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/context/AuthContext";
import { SharePostDialog } from "./SharePostDialog";

export const FeedTab = () => {
  const { user } = useAuth();
  const [showPostDialog, setShowPostDialog] = React.useState(false);
  
  const {
    data: posts,
    isLoading,
    error,
  } = useSupabaseQuery({
    queryKey: ["feed-posts"],
    queryFn: async ({ queryKey }) => {
      const { data, error } = await fetch("/api/feed").then(res => res.json());
      
      if (error) throw new Error(error.message);
      
      // For demo, we'll return some mock data
      return [
        {
          id: "1",
          content: "Excited to announce our seed round of $2M led by Acme Ventures! We're building the future of fintech and can't wait to share more.",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          author: {
            id: "author-1",
            name: "TechFin Solutions",
            avatar_url: null,
            verified: true
          },
          likes: 24,
          comments: 5,
          user_has_liked: false,
        },
        {
          id: "2",
          content: "Looking for experienced React developers to join our team. We're working on cutting-edge AI applications that are changing how businesses operate. DM if interested!",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          author: {
            id: "author-2",
            name: "AI Innovations Co",
            avatar_url: null,
            verified: false
          },
          likes: 12,
          comments: 8,
          user_has_liked: true,
        },
        {
          id: "3",
          content: "Just released our latest research paper on sustainable energy solutions. Read it here: flubo.com/research/sustainable-energy",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          author: {
            id: "author-3",
            name: "GreenTech Innovations",
            avatar_url: null,
            verified: true
          },
          likes: 42,
          comments: 15,
          user_has_liked: false,
        }
      ];
    },
    enabled: !!user,
  });
  
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
          {posts.map((post) => (
            <Post key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Your feed is empty. Follow users or create a post!</p>
        </div>
      )}
      
      <SharePostDialog open={showPostDialog} onOpenChange={setShowPostDialog} />
    </div>
  );
};
