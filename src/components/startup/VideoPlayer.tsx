
import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Video } from "lucide-react";

interface VideoPlayerProps {
  youtubeUrl?: string;
  videoPath?: string | null;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  youtubeUrl,
  videoPath,
  className = ""
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract YouTube video ID from URL
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    
    let videoId: string | null = null;
    
    // Match YouTube URL patterns
    const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[1]) {
      videoId = match[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return null;
  };

  // Get public URL for uploaded video
  const getVideoUrl = (path: string) => {
    if (!path) return null;
    
    const { data } = supabase.storage
      .from('demo-videos')
      .getPublicUrl(path);
      
    return data?.publicUrl || null;
  };

  const youtubeEmbedUrl = youtubeUrl ? getYoutubeEmbedUrl(youtubeUrl) : null;
  const uploadedVideoUrl = videoPath ? getVideoUrl(videoPath) : null;

  const handleVideoLoad = () => {
    setLoading(false);
  };

  const handleVideoError = () => {
    setLoading(false);
    setError("Video could not be loaded");
  };

  // Show YouTube embed if URL provided
  if (youtubeEmbedUrl) {
    return (
      <div className={`aspect-video rounded-md overflow-hidden ${className}`}>
        <iframe 
          src={youtubeEmbedUrl}
          title="Demo Video"
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleVideoLoad}
          onError={handleVideoError}
        ></iframe>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        )}
      </div>
    );
  }
  
  // Show uploaded video if path provided
  if (uploadedVideoUrl) {
    return (
      <div className={`aspect-video rounded-md overflow-hidden relative ${className}`}>
        <video 
          src={uploadedVideoUrl}
          className="w-full h-full"
          controls
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
        ></video>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-white">{error}</p>
          </div>
        )}
      </div>
    );
  }
  
  // Fallback for no video
  return (
    <div className={`aspect-video bg-black/10 rounded-md flex items-center justify-center ${className}`}>
      <div className="text-center">
        <Video className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
        <span className="text-muted-foreground">No demo video available</span>
      </div>
    </div>
  );
};
