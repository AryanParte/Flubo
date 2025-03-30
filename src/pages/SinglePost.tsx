
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Post } from "@/components/shared/Post";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const SinglePost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id (
              id,
              name,
              user_type
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          console.error("Error fetching post:", error);
          setError("Post not found or has been deleted");
          setLoading(false);
          return;
        }

        setPost(data);
      } catch (err) {
        console.error("Error in fetchPost:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    } else {
      setError("Post ID is missing");
      setLoading(false);
    }
  }, [id]);

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <Button 
            variant="ghost" 
            className="mb-6 flex items-center"
            onClick={handleGoBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          {loading ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
              <Skeleton className="h-[300px] w-full rounded-md" />
            </div>
          ) : error ? (
            <div className="text-center py-12 border border-border rounded-lg bg-card p-8">
              <h2 className="text-2xl font-bold mb-4">Error</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={handleGoBack}>Go Back</Button>
            </div>
          ) : post ? (
            <div className="max-w-2xl mx-auto">
              <Post
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
              />
            </div>
          ) : (
            <div className="text-center py-12 border border-border rounded-lg bg-card p-8">
              <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
              <p className="text-muted-foreground mb-6">The post you're looking for doesn't exist or has been removed.</p>
              <Button onClick={handleGoBack}>Go Back</Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SinglePost;
