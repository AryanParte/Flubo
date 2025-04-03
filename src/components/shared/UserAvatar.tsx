
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";

type UserAvatarProps = {
  userId: string;
  avatarUrl?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  onAvatarUpdate?: (url: string) => void;
};

export function UserAvatar({ 
  userId, 
  avatarUrl, 
  name, 
  size = "md", 
  editable = false,
  onAvatarUpdate
}: UserAvatarProps) {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-20 w-20",
  };

  const avatarSize = sizeClasses[size];
  const isCurrentUser = user?.id === userId;
  const canEdit = editable && isCurrentUser;
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      setUploading(true);
      const file = e.target.files[0];
      
      // Upload file to Supabase storage
      const folderPath = `${userId}`;
      const filePath = `${folderPath}/${Math.random().toString(36).substring(2)}-${file.name}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);
        
      if (updateError) {
        throw updateError;
      }
      
      // Callback to update parent component
      if (onAvatarUpdate) {
        onAvatarUpdate(publicUrl);
      }
      
      toast({
        title: "Profile picture updated",
        description: "Your avatar has been updated successfully",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your profile picture",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="relative">
      <Avatar className={avatarSize}>
        <AvatarImage src={avatarUrl || ""} alt={name || "User"} />
        <AvatarFallback>
          {name ? name.charAt(0).toUpperCase() : "U"}
        </AvatarFallback>
      </Avatar>
      
      {canEdit && (
        <div className="absolute bottom-0 right-0">
          <div className="relative">
            <Button 
              size="sm" 
              variant="secondary" 
              className="h-7 w-7 rounded-full p-0" 
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
            </Button>
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleFileChange}
              accept="image/*"
              disabled={uploading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
