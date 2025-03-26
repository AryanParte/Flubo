
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { 
  Image, 
  MessageSquare, 
  ThumbsUp, 
  Share, 
  MoreHorizontal, 
  SendHorizontal, 
  Loader2,
  TrendingUp,
  Clock,
  ArrowUp,
  Eye 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Post type definition
type PostAuthor = {
  id: string;
  name: string;
  role: string;
  avatar: string;
};

type Post = {
  id: string;
  author: PostAuthor;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  hashtags?: string[];
  image_url?: string | null;
  created_at: string;
};

export function FeedTab() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPostingContent, setIsPostingContent] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('latest');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{name: string | null, user_type: string | null} | null>(null);
  
  // Extract hashtags from post content
  const extractHashtags = (content: string): string[] => {
    const regex = /#[\w]+/g;
    const matches = content.match(regex) || [];
    return matches.map(tag => tag.substring(1)); // Remove # from tag
  };
  
  // Format timestamp to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
    
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, user_type')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching user profile:", error);
          return;
        }
        
        setUserProfile(data);
      } catch (error) {
        console.error("Error in fetchUserProfile:", error);
      }
    };
    
    fetchUserProfile();
  }, [user]);
  
  // Fetch posts from Supabase
  const fetchPosts = async (filter = 'latest') => {
    setIsLoadingPosts(true);
    try {
      // In a production app, fetch real posts from Supabase
      // No mock posts here - we've removed the placeholder posts
      
      // Simulate an empty response for now as we're removing mock data
      // In a real implementation, you would fetch actual posts from a 'posts' table
      const emptyPosts: Post[] = [];
      
      // Apply filtering (would work with real posts)
      let filteredPosts = [...emptyPosts];
      switch (filter) {
        case 'latest':
          filteredPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'trending':
          filteredPosts.sort((a, b) => b.comments + b.likes - (a.comments + a.likes));
          break;
        case 'top':
          filteredPosts.sort((a, b) => b.likes - a.likes);
          break;
        case 'most-viewed':
          filteredPosts.sort((a, b) => (b.likes * 2 + b.comments) - (a.likes * 2 + a.comments));
          break;
        default:
          break;
      }
      
      // Collect all unique hashtags
      const allHashtags = new Set<string>();
      filteredPosts.forEach(post => {
        post.hashtags?.forEach(tag => allHashtags.add(tag));
      });
      
      setHashtags(Array.from(allHashtags));
      setPosts(filteredPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error fetching posts",
        description: "There was an error loading the feed",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPosts(false);
    }
  };
  
  // Handle file selection for image upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
  };
  
  // Upload image to storage (in a real app, this would upload to Supabase Storage)
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      // In a real implementation, you'd use Supabase Storage
      // For now, just return the preview URL
      return imagePreviewUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };
  
  // Handle liking a post
  const handleLike = async (postId: string) => {
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
    
    // In a real implementation, this would update the likes in Supabase
  };
  
  // Handle creating a new post
  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedImage) {
      toast({
        title: "Cannot create empty post",
        description: "Please add some content or an image to your post",
        variant: "destructive",
      });
      return;
    }
    
    setIsPostingContent(true);
    
    try {
      // Extract hashtags
      const extractedHashtags = extractHashtags(newPostContent);
      
      // Upload image if one is selected
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }
      
      // In a real implementation, this would save to Supabase
      // Example of how it would be implemented:
      // const { data, error } = await supabase.from('posts').insert({
      //   user_id: user?.id,
      //   content: newPostContent,
      //   hashtags: extractedHashtags,
      //   image_url: imageUrl,
      // }).select();
      
      const newPost: Post = {
        id: Date.now().toString(),
        author: {
          id: user?.id || 'anonymous',
          name: userProfile?.name || (user?.user_metadata?.name as string) || 'Anonymous User',
          role: userProfile?.user_type === 'startup' ? 'Business' : 'Investor',
          avatar: '/placeholder.svg'
        },
        content: newPostContent,
        timestamp: 'Just now',
        likes: 0,
        comments: 0,
        isLiked: false,
        hashtags: extractedHashtags,
        image_url: imageUrl,
        created_at: new Date().toISOString()
      };
      
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setSelectedImage(null);
      setImagePreviewUrl(null);
      
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
  
  // Filter by hashtag
  const filterByHashtag = (tag: string) => {
    const filtered = posts.filter(post => 
      post.hashtags?.includes(tag)
    );
    setPosts(filtered);
    
    toast({
      title: `Showing posts with #${tag}`,
      description: `${filtered.length} posts found`,
    });
  };
  
  // Load posts when component mounts or filter changes
  useEffect(() => {
    fetchPosts(selectedFilter);
  }, [selectedFilter]);
  
  return (
    <div className="flex flex-col space-y-6 max-w-3xl mx-auto">
      {/* Create Post Card */}
      <Card className="p-4">
        <div className="flex space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
            <AvatarFallback>
              {userProfile?.name?.charAt(0) || user?.user_metadata?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Share an update, announcement, or ask a question... Use #hashtags for better discoverability"
              className="min-h-[80px] resize-none"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            />
            
            {/* Image preview */}
            {imagePreviewUrl && (
              <div className="relative">
                <img 
                  src={imagePreviewUrl} 
                  alt="Preview" 
                  className="rounded-md max-h-60 object-cover" 
                />
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="absolute top-2 right-2 w-8 h-8 p-0 rounded-full"
                  onClick={handleRemoveImage}
                >
                  &times;
                </Button>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="relative overflow-hidden">
                  <Image className="h-4 w-4 mr-2" />
                  Photo
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </Button>
              </div>
              <Button 
                onClick={handleCreatePost} 
                disabled={(!newPostContent.trim() && !selectedImage) || isPostingContent}
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
      
      {/* Filter Tabs */}
      <Tabs defaultValue="latest" onValueChange={setSelectedFilter}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="latest">
            <Clock className="h-4 w-4 mr-2" />
            Latest
          </TabsTrigger>
          <TabsTrigger value="trending">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="top">
            <ArrowUp className="h-4 w-4 mr-2" />
            Top
          </TabsTrigger>
          <TabsTrigger value="most-viewed">
            <Eye className="h-4 w-4 mr-2" />
            Most Viewed
          </TabsTrigger>
        </TabsList>
        
        {/* Popular Hashtags */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {hashtags.slice(0, 5).map(tag => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="cursor-pointer hover:bg-accent"
                onClick={() => filterByHashtag(tag)}
              >
                #{tag}
              </Badge>
            ))}
            {hashtags.length > 5 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Badge variant="outline" className="cursor-pointer">
                    +{hashtags.length - 5} more
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {hashtags.slice(5).map(tag => (
                    <DropdownMenuItem key={tag} onClick={() => filterByHashtag(tag)}>
                      #{tag}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
        
        <TabsContent value="latest" className="m-0">
          {renderFeed()}
        </TabsContent>
        <TabsContent value="trending" className="m-0">
          {renderFeed()}
        </TabsContent>
        <TabsContent value="top" className="m-0">
          {renderFeed()}
        </TabsContent>
        <TabsContent value="most-viewed" className="m-0">
          {renderFeed()}
        </TabsContent>
      </Tabs>
    </div>
  );
  
  // Helper function to render the feed
  function renderFeed() {
    if (isLoadingPosts) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </Card>
          ))}
        </div>
      );
    }
    
    if (posts.length === 0) {
      return (
        <Card className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">No posts found</h3>
          <p className="text-muted-foreground">Be the first to share something with the community!</p>
        </Card>
      );
    }
    
    return (
      <div className="space-y-4">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Save Post</DropdownMenuItem>
                  <DropdownMenuItem>Follow {post.author.name}</DropdownMenuItem>
                  <DropdownMenuItem>Report Post</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="mt-3">
              <p className="text-sm whitespace-pre-wrap">{post.content}</p>
              
              {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {post.hashtags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="text-xs cursor-pointer hover:bg-accent"
                      onClick={() => filterByHashtag(tag)}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {post.image_url && (
              <div className="mt-3">
                <img 
                  src={post.image_url} 
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
                className={post.isLiked ? "text-primary" : ""}
                onClick={() => handleLike(post.id)}
              >
                <ThumbsUp className={`h-4 w-4 mr-2 ${post.isLiked ? "fill-primary" : ""}`} />
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
    );
  }
}
