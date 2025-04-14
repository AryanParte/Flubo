import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Video, Link, Youtube } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { executeSQL } from "@/lib/db-utils";

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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bucketReady, setBucketReady] = useState(false);

  // Check if the bucket exists
  useEffect(() => {
    const checkBucket = async () => {
      try {
        console.log("Checking demo-videos bucket...");
        // First check if bucket exists
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
          console.error("Failed to list buckets:", listError);
          return;
        }
        
        const bucketExists = buckets?.some(bucket => bucket.name === 'demo-videos');
        
        if (!bucketExists) {
          // Create the bucket if it doesn't exist
          console.log("Creating demo-videos bucket...");
          const { error: createError } = await supabase.storage.createBucket('demo-videos', {
            public: true
          });
          
          if (createError) {
            console.error("Failed to create bucket:", createError);
            return;
          }
          
          console.log("Bucket created successfully");
        } else {
          console.log("Bucket already exists");
          
          // Make sure it's set to public
          const { error: updateError } = await supabase.storage.updateBucket('demo-videos', {
            public: true
          });
          
          if (updateError) {
            console.error("Failed to update bucket settings:", updateError);
          } else {
            console.log("Updated bucket to be public");
          }
        }
        
        // Create policies using the createStoragePolicy function
        await createStoragePolicy('demo-videos', 'allow_uploads_videos', {
          name: "Allow Video Uploads",
          action: "INSERT",
          role: "authenticated",
          check: {}
        });
        
        await createStoragePolicy('demo-videos', 'public_select_videos', {
          name: "Public Video Select",
          action: "SELECT",
          role: "*",
          check: {}
        });
        
        setBucketReady(true);
        console.log("Bucket demo-videos is ready for use");
      } catch (error) {
        console.error("Error checking/creating bucket:", error);
      }
    };
    
    checkBucket();
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

      // Get the authenticated user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Wait for bucket to be ready or force setup
      if (!bucketReady) {
        console.log("Waiting for bucket to be ready...");
        toast({
          title: "Preparing storage",
          description: "Setting up storage for your video, please wait..."
        });
        
        // Manually ensure the bucket is ready
        try {
          // First check if bucket exists
          const { data: buckets, error: listError } = await supabase.storage.listBuckets();
          
          if (listError) {
            console.error("Failed to list buckets:", listError);
            throw new Error("Failed to access storage");
          }
          
          const bucketExists = buckets?.some(bucket => bucket.name === 'demo-videos');
          
          if (!bucketExists) {
            // Create the bucket if it doesn't exist
            const { error: createError } = await supabase.storage.createBucket('demo-videos', {
              public: true
            });
            
            if (createError) {
              console.error("Failed to create bucket:", createError);
              throw new Error("Failed to create storage bucket");
            }
          }
          
          // Make sure it's set to public
          const { error: updateError } = await supabase.storage.updateBucket('demo-videos', {
            public: true
          });
          
          if (updateError) {
            console.error("Failed to update bucket settings:", updateError);
          }
          
          // Create policies using the createStoragePolicy function
          await createStoragePolicy('demo-videos', 'allow_uploads_videos', {
            name: "Allow Video Uploads",
            action: "INSERT",
            role: "authenticated",
            check: {}
          });
          
          await createStoragePolicy('demo-videos', 'public_select_videos', {
            name: "Public Video Select",
            action: "SELECT",
            role: "*",
            check: {}
          });
        } catch (setupError) {
          console.error("Error in bucket setup:", setupError);
          throw new Error("Failed to set up storage bucket");
        }
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `${user.id}_${timestamp}_${randomString}.${fileExt}`;
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
              upsert: true
            });
            
          if (uploadError) {
            console.error(`Attempt ${attempts} failed:`, uploadError);
            console.error("Error details:", uploadError.message);
            lastError = uploadError;
            
            // Wait a bit before retrying
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
              continue;
            } else {
              throw uploadError;
            }
          }
          
          uploadResult = data;
          break;
        } catch (err) {
          console.error(`Error in attempt ${attempts}:`, err);
          lastError = err;
          
          if (attempts >= maxAttempts) {
            break;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
      
      // If all attempts failed
      if (!uploadResult && lastError) {
        throw lastError;
      }

      // Clear the progress interval
      clearInterval(progressInterval);

      // Complete the progress
      setUploadProgress(100);

      // Get the public URL for the uploaded video
      const { data: urlData } = supabase.storage
        .from('demo-videos')
        .getPublicUrl(filePath);

      console.log("Upload completed, public URL:", urlData);
      
      // Update the video path
      onPathChange(filePath);

      toast({
        title: "Video uploaded successfully",
        description: "Your demo video has been uploaded",
      });

      // Reset the form state
      setUploadProgress(0);
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

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="demoUrl" className="text-sm font-medium text-muted-foreground">Demo URL (Website)</Label>
        <Input 
          id="demoUrl"
          value={demoUrl} 
          onChange={(e) => onVideoChange('demoUrl', e.target.value)}
          className="mt-1"
          placeholder="https://demo.example.com"
          disabled={disabled}
        />
      </div>
      
      <div>
        <Label htmlFor="demoVideo" className="text-sm font-medium text-muted-foreground">YouTube Demo Video</Label>
        <Input 
          id="demoVideo"
          value={demoVideo} 
          onChange={(e) => onVideoChange('demoVideo', e.target.value)}
          className="mt-1"
          placeholder="https://youtube.com/watch?v=example"
          disabled={disabled}
        />
        {!disabled && (
          <p className="text-xs text-muted-foreground mt-1">
            <Youtube size={12} className="inline mr-1" />
            Enter a YouTube URL to your demo video
          </p>
        )}
      </div>
      
      {!disabled && (
        <div>
          <Label htmlFor="videoUpload" className="text-sm font-medium text-muted-foreground mb-1 block">
            Or Upload Video File
          </Label>
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              id="videoUpload"
              type="file"
              accept="video/mp4,video/webm,video/ogg"
              onChange={handleFileUpload}
              disabled={uploading || disabled}
              className="flex-1"
            />
            {uploading && (
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">{uploadProgress}%</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            <Video size={12} className="inline mr-1" />
            Upload a video file (MP4, WebM, OGG) up to 100MB
          </p>
        </div>
      )}
      
      {demoVideoPath && (
        <div className="text-sm flex items-center text-accent">
          <Video size={16} className="mr-1" />
          <span>Video uploaded</span>
        </div>
      )}
    </div>
  );
};
