
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Video, Link, Youtube } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

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

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

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

      // Upload the file
      const { error: uploadError, data } = await supabase.storage
        .from('demo-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      // Clear the progress interval
      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      // Complete the progress
      setUploadProgress(100);

      // Get the public URL for the uploaded video
      const { data: urlData } = supabase.storage
        .from('demo-videos')
        .getPublicUrl(filePath);

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
