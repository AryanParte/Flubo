import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, FileText, Link, Eye, EyeOff, ExternalLink, Trash } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { getSupabaseClient } from "@/lib/supabase-client-helper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PitchdeckViewer } from "./PitchdeckViewer";
import { useAuth } from "@/context/AuthContext";

interface PitchdeckUploadProps {
  pitchdeckUrl: string;
  pitchdeckPath: string | null;
  pitchdeckFileType: string;
  pitchdeckIsPublic: boolean;
  onPitchdeckChange: (field: string, value: string | boolean) => void;
  onPathChange: (path: string) => void;
  disabled?: boolean;
}

export const PitchdeckUpload: React.FC<PitchdeckUploadProps> = ({
  pitchdeckUrl,
  pitchdeckPath,
  pitchdeckFileType,
  pitchdeckIsPublic,
  onPitchdeckChange,
  onPathChange,
  disabled = false
}) => {
  const { user } = useAuth(); // Get user from auth context
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Extract filename from path if it exists
  useEffect(() => {
    if (pitchdeckPath) {
      const pathParts = pitchdeckPath.split('/');
      if (pathParts.length > 0) {
        setFileName(pathParts[pathParts.length - 1]);
      }
    }
  }, [pitchdeckPath]);

  // Verify authentication when component loads
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        console.error("Authentication check failed:", error);
        setAuthError("Please log in to upload files");
      } else {
        setAuthError(null);
        // Debug: Check if user has proper access to the bucket
        try {
          const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
          
          if (bucketError) {
            console.error("Error listing buckets:", bucketError);
            setDebugInfo(`Bucket access error: ${bucketError.message}`);
          } else {
            console.log("Available buckets:", buckets?.map(b => b.name));
            const hasAccessToPitchdecks = buckets?.some(b => b.name === 'pitchdecks');
            if (!hasAccessToPitchdecks) {
              setDebugInfo("Warning: 'pitchdecks' bucket not found. Migration might not be applied.");
            }
          }
        } catch (e) {
          console.error("Error checking bucket access:", e);
        }
      }
    };
    
    checkAuth();
  }, []);

  // Handle file upload to Supabase storage
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 25MB",
        variant: "destructive"
      });
      return;
    }

    // Check file type - accept PDF and PowerPoint formats
    const allowedTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
      'application/vnd.ms-powerpoint' // PPT
    ];
    
    // Also check by extension if mime type is not recognized correctly
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['pdf', 'pptx', 'ppt'];
    const isAllowedType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExt);
    
    if (!isAllowedType) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or PowerPoint (PPT/PPTX) file",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setDebugInfo(null);

      // Verify user is authenticated
      if (!user) {
        // Try to refresh the session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('User not authenticated. Please log in again.');
        }
      }
      
      // Create a unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize original filename
      const fileName = `${timestamp}_${randomString}_${safeFileName}`;
      
      // Important: Ensure user ID is available and properly formatted
      if (!user?.id) {
        throw new Error('User ID not available. Please refresh the page and try again.');
      }
      
      // Create a direct path without folders to simplify
      const filePath = `${user.id}/${fileName}`;

      setFileName(fileName);

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
      console.log("File type:", file.type);
      console.log("File extension:", fileExt);
      
      // Determine content type based on extension if mime type is not recognized
      let contentType = file.type;
      if (!contentType || contentType === 'application/octet-stream') {
        if (fileExt === 'pdf') {
          contentType = 'application/pdf';
        } else if (fileExt === 'pptx') {
          contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        } else if (fileExt === 'ppt') {
          contentType = 'application/vnd.ms-powerpoint';
        }
      }
      console.log("Using content type:", contentType);

      // Upload the file with retry logic
      let attempts = 0;
      const maxAttempts = 3;
      let lastError = null;
      let uploadResult = null;
      
      // First check if the bucket exists and user has access
      try {
        const { data: objects, error: listError } = await supabase.storage
          .from('pitchdecks')
          .list(user.id, { limit: 1 });
          
        if (listError) {
          console.error("Error accessing pitchdecks bucket:", listError);
          setDebugInfo(`Bucket access error: ${listError.message}`);
        } else {
          console.log("Successfully accessed bucket");
        }
      } catch (e) {
        console.error("Error checking bucket access:", e);
      }
      
      while (attempts < maxAttempts && !uploadResult) {
        attempts++;
        console.log(`Upload attempt ${attempts}/${maxAttempts}`);
        
        try {
          const { error: uploadError, data } = await supabase.storage
            .from('pitchdecks')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true,
              contentType: contentType
            });
          
          if (uploadError) {
            console.error(`Upload attempt ${attempts} failed:`, uploadError);
            console.error("Error message:", uploadError.message);
            
            // Fix: Use correct error properties
            if (uploadError.message) {
              setDebugInfo(`Upload error: ${uploadError.message}`);
            }
            
            lastError = uploadError;
            if (attempts === maxAttempts) {
              throw uploadError;
            }
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          } else {
            uploadResult = data;
            console.log("Upload succeeded:", data);
            break; // Success, exit the loop
          }
        } catch (error) {
          console.error(`Error in upload attempt ${attempts}:`, error);
          if (error instanceof Error) {
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
            setDebugInfo(`Upload exception: ${error.message}`);
          } else {
            console.error("Unknown error type:", error);
            setDebugInfo(`Unknown error type: ${JSON.stringify(error)}`);
          }
          
          lastError = error;
          if (attempts === maxAttempts) {
            throw error;
          }
        }
      }
      
      // Clear the progress interval
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      // Set to 100% when done
      setUploadProgress(100);
      
      if (!uploadResult) {
        throw new Error("Failed to upload file after multiple attempts");
      }
      
      // Update the path in state and parent component
      onPathChange(filePath);
      
      // Store empty string to pitchdeckUrl field to indicate it's using stored file
      onPitchdeckChange('pitchdeckUrl', '');
      
      // Get the URL to the uploaded file for potential public sharing
      const client = getSupabaseClient();
      const { data: urlData } = client.storage
        .from('pitchdecks')
        .getPublicUrl(filePath);
      
      console.log("File public URL:", urlData.publicUrl);
      
      // Update the profile record with the new path and file type
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error: updateError } = await supabase
          .from('startup_profiles')
          .update({
            pitchdeck_path: filePath,
            pitchdeck_file_type: contentType,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);
          
        if (updateError) {
          console.error("Error updating profile with pitchdeck path:", updateError);
        }
      }

      toast({
        title: "Pitchdeck uploaded successfully",
        description: "Your pitchdeck has been uploaded",
      });

      // Reset the form state
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // When uploading, update the file type
      onPitchdeckChange('pitchdeckFileType', contentType);
      
    } catch (error) {
      console.error("Error uploading pitchdeck:", error);
      let errorMessage = "Something went wrong";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) {
          errorMessage = "An unknown error occurred";
        }
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle toggling the pitchdeck visibility
  const handleTogglePublic = async (isPublic: boolean) => {
    try {
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to update privacy settings");
      }

      console.log("Updating pitchdeck visibility to:", isPublic);

      // Update the visibility in the database
      const { error: updateError } = await supabase
        .from('startup_profiles')
        .update({
          pitchdeck_is_public: isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);
        
      if (updateError) {
        console.error("Error updating pitchdeck visibility:", updateError);
        throw updateError;
      }
      
      // Update local state
      onPitchdeckChange('pitchdeckIsPublic', isPublic);
      
      toast({
        title: isPublic ? "Pitchdeck is now public" : "Pitchdeck is now private",
        description: isPublic 
          ? "Your pitchdeck can now be viewed by anyone" 
          : "Your pitchdeck is now only visible to you",
      });
    } catch (error) {
      console.error("Error toggling pitchdeck visibility:", error);
      toast({
        title: "Failed to update privacy settings",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive"
      });
    }
  };

  // Handle opening preview
  const handleOpenPreview = () => {
    if (pitchdeckPath) {
      setPreviewOpen(true);
    } else if (pitchdeckUrl) {
      // Open external URL in new tab
      window.open(pitchdeckUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle removing the pitchdeck
  const handleRemovePitchdeck = async () => {
    try {
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to remove your pitchdeck");
      }

      // If there's a path, delete the file from storage
      if (pitchdeckPath) {
        const { error: deleteError } = await supabase.storage
          .from('pitchdecks')
          .remove([pitchdeckPath]);
          
        if (deleteError) {
          console.error("Error deleting pitchdeck file:", deleteError);
          // Continue with database update even if file delete fails
        }
      }
      
      // Update the profile record
      const { error: updateError } = await supabase
        .from('startup_profiles')
        .update({
          pitchdeck_path: null,
          pitchdeck_url: null,
          pitchdeck_file_type: null,
          pitchdeck_is_public: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);
        
      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      onPathChange('');
      onPitchdeckChange('pitchdeckUrl', '');
      onPitchdeckChange('pitchdeckFileType', '');
      onPitchdeckChange('pitchdeckIsPublic', false);
      setFileName('');
      
      toast({
        title: "Pitchdeck removed",
        description: "Your pitchdeck has been removed",
      });
    } catch (error) {
      console.error("Error removing pitchdeck:", error);
      toast({
        title: "Failed to remove pitchdeck",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive"
      });
    }
  };

  // Update the icon in the display based on file type
  const getFileIcon = () => {
    if (pitchdeckFileType && pitchdeckFileType.includes('powerpoint')) {
      return <FileText className="h-5 w-5 text-orange-500" />;
    }
    return <FileText className="h-5 w-5 text-primary" />;
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
      {debugInfo && (
        <div className="p-2 border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 rounded-md text-xs">
          <p className="font-mono">{debugInfo}</p>
        </div>
      )}
      
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="pitchdeckUpload" className="text-sm font-medium">
            Pitch Deck
          </Label>
          
          {(pitchdeckPath || pitchdeckUrl) && !disabled && (
            <Button 
              variant="destructive" 
              size="sm"
              className="h-7 px-2 flex items-center space-x-1"
              onClick={handleRemovePitchdeck}
              disabled={uploading}
            >
              <Trash className="h-3 w-3" />
              <span>Remove</span>
            </Button>
          )}
        </div>
        
        {!disabled && !pitchdeckPath && !pitchdeckUrl && (
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
                    Upload Pitch Deck (PDF or PPT)
                  </>
                )}
              </Button>
              
              <input
                id="pitchdeckUpload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx,application/vnd.ms-powerpoint,.ppt"
                ref={fileInputRef}
                disabled={uploading || disabled || !user}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Upload your pitch deck as a PDF or PowerPoint (PPT/PPTX) file (max 25MB)
            </p>
          </div>
        )}
        
        {(pitchdeckPath || pitchdeckUrl) && (
          <div className="mt-2 p-3 border rounded-md bg-muted/30 flex flex-col space-y-3">
            <div className="flex items-center gap-2">
              {getFileIcon()}
              <span className="text-sm font-medium flex-1 truncate">
                {pitchdeckUrl ? pitchdeckUrl : fileName}
              </span>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-7"
                      onClick={handleOpenPreview}
                    >
                      {pitchdeckUrl ? <ExternalLink className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{pitchdeckUrl ? "Open external link" : "Preview pitchdeck"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pitchdeckVisibility" className="text-sm">Make public</Label>
                <p className="text-xs text-muted-foreground">
                  {pitchdeckIsPublic 
                    ? "Your pitch deck is publicly visible" 
                    : "Only you can see your pitch deck"}
                </p>
              </div>
              <Switch
                id="pitchdeckVisibility"
                checked={pitchdeckIsPublic}
                onCheckedChange={handleTogglePublic}
                disabled={disabled || uploading}
              />
            </div>
          </div>
        )}
        
        {!pitchdeckPath && (
          <div>
            <Label htmlFor="pitchdeckUrl" className="text-sm font-medium text-muted-foreground">
              External Pitch Deck URL
            </Label>
            <Input 
              id="pitchdeckUrl"
              value={pitchdeckUrl} 
              onChange={(e) => onPitchdeckChange('pitchdeckUrl', e.target.value)}
              className="mt-1"
              placeholder="https://docs.example.com/pitchdeck.pdf"
              disabled={disabled || uploading || !!pitchdeckPath}
            />
            {!disabled && !pitchdeckPath && (
              <p className="text-xs text-muted-foreground mt-1">
                <Link size={12} className="inline mr-1" />
                Enter a URL to your pitch deck if it's hosted elsewhere
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-2">
            <DialogTitle>Pitch Deck Preview</DialogTitle>
            <DialogDescription>
              {fileName}
            </DialogDescription>
          </DialogHeader>
          
          <PitchdeckViewer
            filePath={pitchdeckPath || ""}
            fileName={fileName}
            fileUrl={pitchdeckUrl}
            onClose={() => setPreviewOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
