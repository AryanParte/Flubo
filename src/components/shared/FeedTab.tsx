import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Post } from "@/components/shared/Post";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Post as PostType } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useState as useHookState } from "react";

export function FeedTab() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recent");
  const [showPostDialog, setShowPostDialog] = useHookState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      if (filter === "following" && user) {
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
          setPosts([]);
          setIsLoading(false);
          return;
        }
      }

      if (filter === "recent") {
        query = query.order('created_at', { ascending: false });
      } else if (filter === "popular") {
        query = query.order('likes', { ascending: false });
      }

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
    console.log(`Clicked on hashtag: ${tag}`);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      
      reader.readAsDataURL(file);
      setSelectedImage(file);
    }
  };
  
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmitPost = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to create posts",
        variant: "destructive",
      });
      return;
    }
    
    if (!newPostContent.trim()) {
      toast({
        title: "Empty post",
        description: "Please enter some content for your post",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const hashtagRegex = /#(\w+)/g;
      const hashtags = [...newPostContent.matchAll(hashtagRegex)].map(match => match[1]);
      
      let imageUrl = null;
      
      if (selectedImage) {
        const filePath = `post-images/${user.id}/${Date.now()}-${selectedImage.name.replace(/\s+/g, '-')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, selectedImage);
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data: publicURL } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);
          
        imageUrl = publicURL.publicUrl;
      }
      
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          content: newPostContent,
          user_id: user.id,
          hashtags: hashtags,
          image_url: imageUrl
        })
        .select()
        .single();
        
      if (postError) {
        throw postError;
      }
      
      setNewPostContent("");
      setSelectedImage(null);
      setImagePreview(null);
      setShowPostDialog(false);
      
      fetchPosts(activeTab);
      
      toast({
        title: "Post created",
        description: "Your post has been published successfully"
      });
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {user && (
        <div className="mb-6 flex justify-end">
          <Button 
            onClick={() => setShowPostDialog(true)}
            className="flex items-center gap-2"
            variant="default"
          >
            <Plus size={18} />
            Create Post
          </Button>
        </div>
      )}
      
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
      
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>
              Share your thoughts, updates, or ask questions to the community.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="What's on your mind?"
              className="min-h-[100px]"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            />
            
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-[200px] w-auto object-contain rounded-md border border-border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-border rounded-md">
                <label className="cursor-pointer text-center">
                  <span className="text-sm text-muted-foreground block mb-2">Add an image to your post</span>
                  <Button variant="outline" size="sm" type="button">
                    Select Image
                  </Button>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              <p>Pro tip: Use #hashtags to categorize your post</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitPost} disabled={!newPostContent.trim() || isSubmitting}>
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
