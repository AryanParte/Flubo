import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Post } from "@/components/shared/Post";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Post as PostType } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Plus, X, Upload, Loader2, AlertCircle } from "lucide-react";
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
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { createStoragePolicy } from "@/functions/create_storage_policy";
import { executeSQL } from "@/lib/db-utils";

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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useRealtimeSubscription<PostType>(
    'posts',
    ['INSERT', 'DELETE', 'UPDATE'],
    (payload) => {
      if (payload.eventType === 'INSERT') {
        fetchPosts(activeTab);
      } else if (payload.eventType === 'DELETE') {
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== payload.old.id));
      } else if (payload.eventType === 'UPDATE') {
        setPosts((prevPosts) =>
          prevPosts.map((post) => (post.id === payload.new.id ? payload.new : post))
        );
      }
    }
  );

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
    setUploadError(null);
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("File selected:", file.name, "Size:", (file.size / 1024 / 1024).toFixed(2) + "MB");
      
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Image must be less than 5MB");
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          setImagePreview(e.target.result as string);
        }
      };
      
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        setUploadError("Failed to read file");
        toast({
          title: "Error",
          description: "Failed to read image file",
          variant: "destructive",
        });
      };
      
      try {
        reader.readAsDataURL(file);
        setSelectedImage(file);
      } catch (error) {
        console.error("Error reading file:", error);
        setUploadError("Failed to process image");
        toast({
          title: "Error",
          description: "Failed to process image file",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setUploadError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleImageButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
      console.log("File input clicked");
    }
  };

  const setupBucket = async () => {
    try {
      console.log("Setting up storage bucket 'posts'...");
      
      // First check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error("Failed to list buckets:", listError);
        return false;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'posts');
      
      if (!bucketExists) {
        console.log("Creating new 'posts' bucket...");
        const { error: createError } = await supabase.storage.createBucket('posts', {
          public: true
        });
        
        if (createError) {
          console.error("Failed to create bucket:", createError);
          return false;
        }
        
        console.log("Successfully created bucket");
      } else {
        console.log("Bucket 'posts' already exists");
        
        // Make sure bucket is set to public
        const { error: updateError } = await supabase.storage.updateBucket('posts', {
          public: true
        });
        
        if (updateError) {
          console.error("Failed to update bucket settings:", updateError);
          // Continue anyway as this is not critical
        } else {
          console.log("Updated bucket to be public");
        }
      }

      // Only create policies if the bucket was just created
      if (!bucketExists) {
        // Create a standardized upload policy
        await createStoragePolicy('posts', 'allow_uploads', {
          name: "Allow Uploads",
          action: "INSERT",
          role: "authenticated",
          check: {}
        });
        
        // Create a standardized read policy
        await createStoragePolicy('posts', 'public_select', {
          name: "Public Select",
          action: "SELECT",
          role: "*",
          check: {}
        });
      }
      
      return true;
    } catch (error) {
      console.error("Unexpected error in setupBucket:", error);
      return false;
    }
  };

  const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    console.log("Starting image upload process for", file.name, "size:", (file.size / 1024 / 1024).toFixed(2) + "MB");
    
    try {
      // Set up bucket first and ensure it returns true before continuing
      const bucketSetup = await setupBucket();
      if (!bucketSetup) {
        console.error("Failed to set up storage bucket");
        throw new Error("Failed to set up storage bucket");
      }
      
      // Generate file path with timestamp and random string to avoid collisions
      const fileExt = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const filePath = `${userId}/${timestamp}_${randomString}.${fileExt}`;
      
      console.log("Generated file path:", filePath);
      
      // Upload file with retry logic
      let attempts = 0;
      const maxAttempts = 3;
      let lastError = null;
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`Upload attempt ${attempts}/${maxAttempts}`);
        
        try {
          // Verify bucket exists before upload
          const { data: buckets } = await supabase.storage.listBuckets();
          const bucketExists = buckets?.some(bucket => bucket.name === 'posts');
          
          if (!bucketExists) {
            console.error("Bucket 'posts' does not exist before upload attempt");
            throw new Error("Storage bucket does not exist");
          }
          
          // Attempt upload
          const { data, error: uploadError } = await supabase.storage
            .from('posts')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (uploadError) {
            console.error(`Attempt ${attempts} failed:`, uploadError);
            lastError = uploadError;
            
            // More detailed error logging
            if (uploadError.message) {
              console.error("Error message:", uploadError.message);
              
              // Check for RLS errors
              if (uploadError.message.includes('new row violates row-level security policy')) {
                console.error("RLS policy violation detected. User might not have permission to upload.");
              }
            }
            
            // Wait a bit before retrying with exponential backoff
            if (attempts < maxAttempts) {
              const waitTime = 1000 * Math.pow(2, attempts - 1); // 1s, 2s, 4s...
              console.log(`Waiting ${waitTime}ms before retry attempt ${attempts + 1}...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            } else {
              throw uploadError;
            }
          }
          
          console.log("File uploaded successfully:", data?.path || filePath);
          
          // Get the public URL
          const { data: publicUrlData } = supabase.storage
            .from('posts')
            .getPublicUrl(filePath);
          
          if (!publicUrlData?.publicUrl) {
            console.error("Failed to get public URL");
            throw new Error("Failed to get public URL for uploaded file");
          }
          
          console.log("Successfully obtained public URL:", publicUrlData.publicUrl);
          return publicUrlData.publicUrl;
        } catch (err) {
          console.error(`Error in attempt ${attempts}:`, err);
          lastError = err;
          
          if (attempts >= maxAttempts) {
            break;
          }
          
          // Wait before retrying with exponential backoff
          const waitTime = 1000 * Math.pow(2, attempts - 1); // 1s, 2s, 4s...
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      // If we got here, all attempts failed
      throw lastError || new Error("All upload attempts failed");
    } catch (error) {
      console.error("Upload process failed:", error);
      throw error;
    }
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
      console.log("Starting post submission process...");
      
      const hashtagRegex = /#(\w+)/g;
      const hashtags = [...newPostContent.matchAll(hashtagRegex)].map(match => match[1]);
      console.log("Extracted hashtags:", hashtags);
      
      let imageUrl = null;
      
      if (selectedImage) {
        console.log("Uploading image:", selectedImage.name, "Size:", (selectedImage.size / 1024 / 1024).toFixed(2) + "MB");
        
        try {
          imageUrl = await uploadImage(selectedImage, user.id);
          console.log("Image uploaded successfully with URL:", imageUrl);
        } catch (uploadError: any) {
          console.error("Failed to upload image:", uploadError);
          toast({
            title: "Image upload failed",
            description: uploadError?.message || "Failed to upload image. Please try again.",
            variant: "destructive"
          });
          
          // Return early without creating the post if image upload fails
          setIsSubmitting(false);
          return;
        }
      } else {
        console.log("No image selected for upload");
      }
      
      console.log("Creating post with image URL:", imageUrl);
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          content: newPostContent,
          user_id: user.id,
          hashtags: hashtags,
          image_url: imageUrl,
          likes: 0,
          comments_count: 0
        })
        .select();
        
      if (postError) {
        console.error("Error creating post:", postError);
        throw new Error(`Error creating post: ${postError.message}`);
      }
      
      console.log("Post created successfully:", post);
      
      setNewPostContent("");
      setSelectedImage(null);
      setImagePreview(null);
      setUploadError(null);
      setShowPostDialog(false);
      
      fetchPosts(activeTab);
      
      toast({
        title: "Post created",
        description: "Your post has been published successfully"
      });
    } catch (error: any) {
      console.error("Error in handleSubmitPost:", error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
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
                onPostDeleted={handlePostDeleted}
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
                onPostDeleted={handlePostDeleted}
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
                onPostDeleted={handlePostDeleted}
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
              disabled={isSubmitting}
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
                  disabled={isSubmitting}
                >
                  <X size={16} />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-border rounded-md">
                <div className="cursor-pointer text-center w-full">
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={24} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground block">Add an image to your post</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      type="button"
                      onClick={handleImageButtonClick}
                      disabled={isSubmitting}
                    >
                      Select Image
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}
            
            {uploadError && (
              <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                <AlertCircle size={16} />
                {uploadError}
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
            <Button 
              onClick={handleSubmitPost} 
              disabled={!newPostContent.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
