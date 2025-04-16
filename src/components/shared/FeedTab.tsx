import { useState, useEffect, useRef, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Post } from "@/components/shared/Post";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Post as PostType } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Plus, X, Upload, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast, useToast } from "@/components/ui/use-toast";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { createStoragePolicy } from "@/functions/create_storage_policy";
import { executeSQL } from "@/lib/db-utils";

// Define the Database type if it doesn't exist
type Database = {
  public: {
    Tables: {
      posts: {
        Insert: {
          content: string;
          user_id: string;
          hashtags: string[] | null;
          image_url?: string | null;
        }
      }
    }
  }
}

export function FeedTab() {
  const { user } = useAuth();
  const { toast: showToast, dismiss: dismissToast } = useToast();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recent");
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = useCallback(async (filter: string) => {
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
  }, [user]);

  const handleRealtimeEvent = useCallback((payload: any) => {
    if (payload.eventType === 'INSERT') {
      fetchPosts(activeTab);
    } else if (payload.eventType === 'DELETE') {
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== payload.old.id));
    } else if (payload.eventType === 'UPDATE') {
      setPosts((prevPosts) =>
        prevPosts.map((post) => (post.id === payload.new.id ? payload.new : post))
      );
    }
  }, [activeTab, fetchPosts]);

  useRealtimeSubscription<PostType>(
    'posts',
    ['INSERT', 'DELETE', 'UPDATE'],
    handleRealtimeEvent
  );

  useEffect(() => {
    if (activeTab) {
      fetchPosts(activeTab);
    }
  }, [activeTab, fetchPosts]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  const handleHashtagClick = useCallback((tag: string) => {
    console.log(`Clicked on hashtag: ${tag}`);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("File selected:", file.name, "Size:", (file.size / 1024 / 1024).toFixed(2) + "MB");
      
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Image must be less than 5MB");
        showToast({
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
        showToast({
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
        showToast({
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

  const uploadImage = async (file: File, userId: string): Promise<string> => {
    console.log(`📤 Starting image upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`File type: ${file.type}, Last modified: ${new Date(file.lastModified).toLocaleString()}`);
    
    // Check file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = `File size exceeds maximum allowed (5MB). Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Create local preview URL as fallback (like in the original working code)
    let localImagePreview: string | null = null;
    try {
      localImagePreview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result && typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to create image preview"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (previewError) {
      console.error("Failed to create local preview fallback:", previewError);
    }

    // Try Supabase upload first
    try {
      // Helper function to convert file to ArrayBuffer for possible fallback
      const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
              resolve(reader.result);
            } else {
              reject(new Error("Failed to convert file to ArrayBuffer"));
            }
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });
      };
      
      // Make sure user is logged in before attempting anything
      console.log(`🔒 Checking authentication before upload...`);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        const errorMsg = "Authentication required. Please log in again to upload images.";
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      console.log(`✅ User authenticated as: ${sessionData.session.user.id}`);
      
      // Ensure bucket exists (try to create if it doesn't)
      console.log("🗂️ Verifying 'posts' storage bucket...");
      try {
        // Check if bucket exists
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        if (bucketError) {
          const errorMsg = `Unable to access storage: ${bucketError.message}`;
          console.error(errorMsg, bucketError);
          throw new Error(errorMsg);
        }
        
        console.log(`Available buckets: ${buckets?.map(b => b.name).join(', ') || 'none'}`);
        const bucketExists = buckets?.some(bucket => bucket.name === 'posts');
        if (!bucketExists) {
          console.log("🆕 'posts' bucket not found, attempting to create it...");
          // Try to create the bucket
          const { error: createError } = await supabase.storage.createBucket('posts', {
            public: true
          });
          
          if (createError) {
            // If creation fails, provide a more helpful error message
            console.error("❌ Failed to create storage bucket:", createError);
            if (createError.message.includes("permission")) {
              throw new Error("You don't have permission to upload images. Please contact support.");
            } else {
              throw new Error(`Storage setup failed: ${createError.message}`);
            }
          }
          
          console.log("✅ Successfully created 'posts' bucket");
        } else {
          console.log("✅ 'posts' bucket exists");
        }
      } catch (error: any) {
        // Special handling for common storage setup errors
        if (error.message.includes("anon key") || error.message.includes("service_role")) {
          console.error("❌ Storage permissions error:", error);
          throw new Error("The application doesn't have proper permissions to manage storage. Please contact support.");
        }
        console.error("❌ Bucket verification failed:", error);
        throw error; // Rethrow other errors
      }
      
      // Generate unique file path to avoid collisions
      const fileExt = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 10);
      const filePath = `${userId}/${timestamp}_${randomString}.${fileExt}`;
      console.log(`📝 Target file path: ${filePath}`);
      
      // Implement retry mechanism
      const MAX_ATTEMPTS = 3;
      let attempts = 0;
      let lastError = null;
      
      // Try standard upload method
      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        console.log(`📤 Upload attempt ${attempts}/${MAX_ATTEMPTS} for ${file.name}`);
        
        try {
          // Add delay between retries with exponential backoff
          if (attempts > 1) {
            const delayMs = 1000 * Math.pow(2, attempts - 2); // 1s, 2s, 4s...
            console.log(`⏱️ Waiting ${delayMs}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
          
          // Prepare upload options
          const uploadOptions = {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type // Explicitly set content type
          };
          console.log(`Upload options: ${JSON.stringify(uploadOptions)}`);
          
          // Attempt the upload
          console.log(`Starting actual upload of ${file.name} (${file.size} bytes)`);
          const uploadResult = await supabase.storage
            .from('posts')
            .upload(filePath, file, uploadOptions);
            
          const { data, error: uploadError } = uploadResult;
          
          // Log the full upload result for debugging
          console.log(`Upload result: ${JSON.stringify({
            data: data ? 'data present' : 'no data',
            error: uploadError ? {
              message: uploadError.message,
              name: uploadError.name,
            } : 'no error'
          })}`);
          
          if (uploadError) {
            console.error(`❌ Upload attempt ${attempts} failed:`, uploadError);
            
            // Provide more detailed error reporting based on error type
            if (uploadError.message.includes("row-level security")) {
              lastError = new Error("Permission denied: You don't have access to upload files. Please contact support.");
            } else if (uploadError.message.includes("MIME")) {
              lastError = new Error(`MIME type issue: The server rejected the file type. Your file type is ${file.type}.`);
            } else if (uploadError.message.includes("internal server error")) {
              lastError = new Error("Server error: The storage server encountered an internal error. Please try again later.");
            } else {
              lastError = uploadError;
            }
            // Continue to next retry
          } else {
            // Upload succeeded, get the public URL
            console.log(`✅ Upload succeeded, generating public URL...`);
            const { data: publicUrlData } = supabase.storage
              .from('posts')
              .getPublicUrl(filePath);
            
            const publicUrl = publicUrlData.publicUrl;
            console.log(`✅ Upload successful! Public URL: ${publicUrl}`);
            return publicUrl;
          }
        } catch (error: any) {
          console.error(`❌ Unexpected error in upload attempt ${attempts}:`, error);
          console.error(`Error stack: ${error.stack}`);
          lastError = error;
          // Continue to next retry
        }
      }
      
      // If standard method failed after all attempts, try alternative approach as last resort
      console.log(`⚠️ All standard upload attempts failed. Trying alternative method...`);
      
      try {
        console.log(`Converting file to ArrayBuffer...`);
        const buffer = await fileToArrayBuffer(file);
        
        console.log(`Using ArrayBuffer upload method (${buffer.byteLength} bytes)...`);
        const { data, error } = await supabase.storage
          .from('posts')
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: true
          });
        
        if (error) {
          console.error("❌ Alternative upload method failed:", error);
          throw new Error(`Alternative upload method failed: ${error.message}`);
        }
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);
        
        const publicUrl = publicUrlData.publicUrl;
        console.log(`✅ Alternative upload successful! Public URL: ${publicUrl}`);
        return publicUrl;
        
      } catch (altError: any) {
        console.error("❌ Alternative upload method also failed:", altError);
        
        // If we got here, all attempts failed including alternative method
        const errorMsg = `Failed to upload image after ${MAX_ATTEMPTS} attempts plus alternative method: ${lastError?.message || "Unknown error"}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (uploadError) {
      // If all Supabase upload attempts failed but we have a local preview URL, use that as fallback
      // This matches the behavior of the original working code
      console.log("⚠️ All upload methods failed. Falling back to local preview URL...");
      
      if (localImagePreview) {
        console.log("✅ Using local preview URL as fallback");
        showToast({
          title: "Image Upload Notice",
          description: "Using local preview instead of cloud storage due to upload issues",
        });
        return localImagePreview;
      }
      
      // If we don't even have a local preview, rethrow the error
      throw uploadError;
    }
  };

  const handleSubmitPost = async () => {
    // Prevent duplicate submissions
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      showToast({
        title: "Creating post...",
        description: "Please wait while we process your post",
      });
      
      // Verify user is logged in
      if (!user) {
        showToast({
          title: "Authentication Error",
          description: "You must be logged in to create a post",
          variant: "destructive",
        });
        setUploadError("You must be logged in to create a post");
        setIsSubmitting(false);
        return;
      }
      
      // Validate content is not empty
      if (!newPostContent.trim()) {
        showToast({
          title: "Validation Error",
          description: "Post content cannot be empty",
          variant: "destructive",
        });
        setUploadError("Post content cannot be empty");
        setIsSubmitting(false);
        return;
      }
      
      // Extract hashtags using regex
      const hashtags = (newPostContent.match(/#[\w]+/g) || []).map(tag => tag.slice(1));
      console.log("Extracted hashtags:", hashtags);
      
      // Prepare the post data
      const postData: Partial<Database['public']['Tables']['posts']['Insert']> = {
        content: newPostContent,
        user_id: user.id,
        hashtags: hashtags.length > 0 ? hashtags : [],
      };
      
      // Process image if selected
      let imageUrl: string | null = null;
      if (selectedImage) {
        try {
          showToast({
            title: "Uploading image...",
            description: "Please wait while we upload your image",
          });
          console.log("Uploading image for post...");
          
          imageUrl = await uploadImage(selectedImage, user.id);
          postData.image_url = imageUrl;
          
          console.log("Image uploaded successfully:", imageUrl);
          showToast({
            title: "Image Upload Success",
            description: "Your image was uploaded successfully",
          });
        } catch (imageError: any) {
          console.error("Image upload failed:", imageError);
          console.error("Error details:", JSON.stringify({
            message: imageError.message,
            name: imageError.name,
            stack: imageError.stack,
            cause: imageError.cause
          }, null, 2));
          
          // Format error message for user display
          const errorMessage = imageError.message || "There was a problem uploading your image";
          let errorDetails = "";
          
          // Add technical details for better debugging
          if (imageError.message && imageError.message.includes("Failed to upload image after")) {
            const technicalDetails = imageError.message.split("Failed to upload image after 3 attempts: ")[1];
            if (technicalDetails) {
              errorDetails = `Technical details: ${technicalDetails}`;
              console.log("Technical error details:", technicalDetails);
            }
          }
          
          const userFriendlyError = errorMessage.includes("Maximum allowed") || errorMessage.includes("File size exceeds")
            ? "The image file is too large. Please choose an image under 5MB."
            : errorMessage.includes("permission") || errorMessage.includes("access")
              ? "You don't have permission to upload images. Please try again later or contact support."
              : errorMessage.includes("bucket") || errorMessage.includes("storage") 
                ? "Storage issue detected. Please try again later."
                : errorMessage.includes("MIME")
                  ? "The file type you're trying to upload isn't supported. Please try a different image format (JPG, PNG, etc)."
                  : errorMessage.includes("Authentication")
                    ? "Your session may have expired. Please try refreshing the page and logging in again."
                    : "There was a problem uploading your image. Please try again with a different image or later.";
                
          // Set the error message for display in the UI
          setUploadError(userFriendlyError);
          
          // Show toast with error and options
          showToast({
            title: "Image Upload Failed",
            description: (
              <div className="space-y-2">
                <p>{userFriendlyError}</p>
                {errorDetails && (
                  <details className="text-xs mt-2">
                    <summary className="cursor-pointer">Show technical details</summary>
                    <p className="mt-1 whitespace-normal break-words">{errorDetails}</p>
                  </details>
                )}
                <div className="pt-1 text-sm">
                  <span className="font-medium">Options: </span>
                  Try again with a smaller or different image, or post without an image.
                </div>
              </div>
            ),
            variant: "destructive",
            duration: 8000, // Show for longer
          });
          
          // Keep the dialog open to let the user decide what to do
          // They can retry, choose another image, or continue without image
          return;
        }
      }
      
      // Create post in database
      showToast({
        title: "Creating post...",
        description: "Saving your post to the database",
      });
      
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();
      
      if (postError) {
        console.error("Error creating post:", postError);
        showToast({
          title: "Post Creation Failed",
          description: postError.message || "There was a problem creating your post",
          variant: "destructive",
        });
        setUploadError(`Failed to create post: ${postError.message}`);
        setIsSubmitting(false);
        return;
      }
      
      // Success! Reset form and refresh posts
      showToast({
        title: "Post Created Successfully",
        description: "Your post has been published",
      });
      
      // Reset form
      setNewPostContent("");
      setSelectedImage(null);
      setImagePreview(null);
      setUploadError(null);
      
      // Refresh posts
      fetchPosts(activeTab);
    } catch (error: any) {
      console.error("Unexpected error creating post:", error);
      setUploadError(`An unexpected error occurred: ${error.message}`);
      showToast({
        title: "Unexpected Error",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  // Update the "Post Without Image" button implementation
  const handlePostWithoutImage = async () => {
    // Clear the image but continue with posting
    setSelectedImage(null);
    setImagePreview(null);
    setUploadError(null);
    
    // Show toast about continuing without image
    showToast({
      title: "Continuing without image",
      description: "Your post will be created without the image",
    });
    
    // Resubmit the post without an image
    if (user && newPostContent.trim()) {
      try {
        setIsSubmitting(true);
        const hashtags = (newPostContent.match(/#[\w]+/g) || []).map(tag => tag.slice(1));
        
        const postData: Partial<Database['public']['Tables']['posts']['Insert']> = {
          content: newPostContent,
          user_id: user.id,
          hashtags: hashtags.length > 0 ? hashtags : [],
        };
        
        showToast({
          title: "Creating post...",
          description: "Saving your post to the database",
        });
        
        const { data: post, error: postError } = await supabase
          .from('posts')
          .insert(postData)
          .select()
          .single();
        
        if (postError) {
          console.error("Error creating post:", postError);
          showToast({
            title: "Post Creation Failed",
            description: postError.message || "There was a problem creating your post",
            variant: "destructive",
          });
          setUploadError(`Failed to create post: ${postError.message}`);
          return;
        }
        
        // Success! Reset form and refresh posts
        showToast({
          title: "Post Created Successfully",
          description: "Your post has been published",
        });
        
        // Reset form
        setNewPostContent("");
        setSelectedImage(null);
        setImagePreview(null);
        setUploadError(null);
        
        // Refresh posts
        fetchPosts(activeTab);
      } catch (error: any) {
        console.error("Unexpected error creating post:", error);
        setUploadError(`An unexpected error occurred: ${error.message}`);
        showToast({
          title: "Unexpected Error",
          description: error.message || "An unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div>
      <Tabs defaultValue="recent" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="following" disabled={!user}>Following</TabsTrigger>
        </TabsList>

        {/* Integrated post creation container - replaces both the placeholder and dialog */}
        {user && (
          <div className="mb-6 mt-2">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                  {/* User avatar - show actual avatar if available */}
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt={user.user_metadata?.name || "User"} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-primary/10">
                      {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <Textarea
                    placeholder="What's on your mind?"
                    className="min-h-[80px] resize-none"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    disabled={isSubmitting}
                  />
                  
                  {/* Image preview and controls */}
                  {imagePreview ? (
                    <div className="relative mt-3">
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
                  ) : null}
                  
                  {/* Error message display */}
                  {uploadError && (
                    <div className="flex flex-col gap-2 p-3 bg-destructive/10 rounded-md border border-destructive/20 mt-3">
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle size={16} />
                        {uploadError}
                      </div>
                      
                      {selectedImage && (
                        <div className="flex gap-2 mt-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              // Retry the upload with the same image
                              handleSubmitPost();
                            }}
                            disabled={isSubmitting}
                          >
                            <RefreshCw size={14} className="mr-1" />
                            Retry Upload
                          </Button>
                          
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => {
                              // Remove the image and clear the error
                              setSelectedImage(null);
                              setImagePreview(null);
                              setUploadError(null);
                            }}
                            disabled={isSubmitting}
                          >
                            <X size={14} className="mr-1" />
                            Remove Image
                          </Button>
                          
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={handlePostWithoutImage}
                            disabled={isSubmitting}
                          >
                            Post Without Image
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    <p>Pro tip: Use #hashtags to categorize your post</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t flex justify-between items-center">
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleImageButtonClick}
                    className="rounded-full text-sm font-normal"
                    disabled={isSubmitting}
                  >
                    <Upload size={18} className="mr-2 text-blue-500" />
                    Photo
                  </Button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                  />
                </div>
                
                <Button 
                  onClick={handleSubmitPost} 
                  disabled={!newPostContent.trim() || isSubmitting}
                  size="sm"
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
              </div>
            </div>
          </div>
        )}
        
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
    </div>
  );
}
