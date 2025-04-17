import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Video, Link, Youtube } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface VideoUploadProps {
  demoUrl: string;
  demoVideo: string;
  demoVideoPath: string | null;
  onVideoChange: (field: string, value: string) => void;
  onPathChange: (path: string) => void;
  disabled?: boolean;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  demoUrl,
  demoVideo,
  demoVideoPath,
  onVideoChange,
  onPathChange,
  disabled = false
}) => {
  const { user } = useAuth(); // Get user from auth context
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Verify authentication when component loads
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        console.error("Authentication check failed:", error);
        setAuthError("Please log in to upload files");
      } else {
        setAuthError(null);
      }
    };
    
    checkAuth();
  }, []);

  // Handle file upload to Supabase storage
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 100MB",
        variant: "destructive"
      });
      return;
    }

    // Check file type
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!videoTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file (MP4, WebM, or OGG)",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Verify user is authenticated
      if (!user) {
        // Try to refresh the session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('User not authenticated. Please log in again.');
        }
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `${user?.id}_${timestamp}_${randomString}.${fileExt}`;
      const filePath = fileName;

      // Set up a simple progress tracker
      let progressInterval: number;
      const simulateProgress = () => {
        progressInterval = window.setInterval(() => {
          setUploadProgress(prev => {
            // Cap at 90% until we know it's complete
            if (prev < 90) {
              return prev + 5;
            }
            return prev;
          });
        }, 500);
      };
      
      simulateProgress();

      console.log("Starting file upload to path:", filePath);
      
      // Upload the file with retry logic
      let attempts = 0;
      const maxAttempts = 3;
      let lastError = null;
      let uploadResult = null;
      
      while (attempts < maxAttempts && !uploadResult) {
        attempts++;
        console.log(`Upload attempt ${attempts}/${maxAttempts}`);
        
        try {
          const { error: uploadError, data } = await supabase.storage
            .from('demo-videos')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true,
              contentType: file.type
            });
            
          if (uploadError) {
            console.error(`Attempt ${attempts} failed:`, uploadError);
            console.error("Error details:", uploadError.message);
            lastError = uploadError;
            
            // Check for RLS errors
            if (uploadError.message.includes('new row violates row-level security policy')) {
              console.error("RLS policy violation detected. User might not have permission to upload.");
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
          } else {
            uploadResult = data;
            console.log("Upload succeeded:", data);
            break;
          }
        } catch (error) {
          console.error(`Error in upload attempt ${attempts}:`, error);
          lastError = error;
          if (attempts === maxAttempts) {
            throw error;
          }
        }
      }
      
      // Clear the progress interval
      if (progressInterval) clearInterval(progressInterval);
      
      // Set to 100% when done
      setUploadProgress(100);
      
      if (!uploadResult) {
        throw new Error("Failed to upload file after multiple attempts");
      }
      
      // Get the URL to the uploaded file
      const { data: urlData } = supabase.storage
        .from('demo-videos')
        .getPublicUrl(filePath);
      
      // Update the profile record with the new path
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error: updateError } = await supabase
          .from('startup_profiles')
          .update({
            demo_video_path: filePath,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);
          
        if (updateError) {
          console.error("Error updating profile with video path:", updateError);
        }
      }
      
      // Update the state
      onPathChange(filePath);
      onVideoChange('demoVideo', ''); // Clear YouTube URL since we're using uploaded video
      
      // Handle completion of product information task
      try {
        const { data: profileTask } = await supabase
          .from('profile_completion_tasks')
          .select('*')
          .eq('startup_id', user?.id)
          .eq('task_name', 'Add product information')
          .single();
          
        if (profileTask && !profileTask.completed) {
          await supabase
            .from('profile_completion_tasks')
            .update({
              completed: true,
              completed_at: new Date().toISOString()
            })
            .eq('id', profileTask.id);
        }
      } catch (error) {
        console.error("Error updating completion task:", error);
      }
      
      toast({
        title: "Video uploaded",
        description: "Your demo video has been uploaded"
      });
      
      // Reset the file input
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error) {
      console.error("Error uploading video:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  
  // Extract video ID from YouTube URL
  const getYoutubeIdFromUrl = (url: string) => {
    if (!url) return '';
    
    // Match common YouTube URL formats:
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://youtu.be/VIDEO_ID
    // https://www.youtube.com/embed/VIDEO_ID
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : '';
  };
  
  if (authError) {
    return (
      <div className="p-4 border border-destructive/30 bg-destructive/10 rounded-md text-center">
        <p className="text-sm text-destructive">{authError}</p>
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <Label htmlFor="videoUpload" className="text-sm font-medium">
          Demo Video
        </Label>
        
        {!demoVideoPath && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || disabled || !user}
                className="w-full justify-start"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Demo Video
                  </>
                )}
              </Button>
              
              <input
                id="videoUpload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept="video/mp4,video/webm,video/ogg"
                ref={fileInputRef}
                disabled={uploading || disabled || !user}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Upload an MP4, WebM, or OGG video file (max 100MB)
            </p>
          </div>
        )}
        
        {demoVideoPath && (
          <div className="flex items-center mt-2">
            <div className="mr-2">
              <Video className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm">Video uploaded</p>
              {!disabled && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-destructive"
                  onClick={() => {
                    onPathChange('');
                    // Also attempt to delete the file from storage
                    if (demoVideoPath) {
                      supabase.storage
                        .from('demo-videos')
                        .remove([demoVideoPath])
                        .then(({ error }) => {
                          if (error) console.error("Error removing video:", error);
                        });
                    }
                  }}
                  disabled={uploading}
                >
                  Remove video
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div>
        <Label htmlFor="demoUrl" className="text-sm font-medium">
          Demo URL
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-2 items-center mt-1">
          <Input
            id="demoUrl"
            value={demoUrl}
            onChange={(e) => onVideoChange('demoUrl', e.target.value)}
            placeholder="Enter a URL to your demo"
            disabled={disabled}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          <Link size={12} className="inline mr-1" />
          Enter a URL to your live demo
        </p>
      </div>
      
      <div>
        <Label htmlFor="demoVideo" className="text-sm font-medium">
          YouTube Demo Video
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-2 items-center mt-1">
          <Input
            id="demoVideo"
            value={demoVideo}
            onChange={(e) => onVideoChange('demoVideo', e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            disabled={disabled || !!demoVideoPath}
          />
          
          {demoVideo && !disabled && !demoVideoPath && getYoutubeIdFromUrl(demoVideo) && (
            <div className="md:col-span-1 p-2 border rounded bg-muted/30">
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${getYoutubeIdFromUrl(demoVideo)}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          <Youtube size={12} className="inline mr-1" />
          Enter a YouTube URL with your product demo
        </p>
      </div>
    </div>
  );
};
