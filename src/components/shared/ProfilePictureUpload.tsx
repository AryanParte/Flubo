
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";

type ProfilePictureUploadProps = {
  currentAvatarUrl?: string | null;
  userName?: string | null;
  onAvatarUpdate: (url: string) => void;
};

export function ProfilePictureUpload({ 
  currentAvatarUrl, 
  userName, 
  onAvatarUpdate 
}: ProfilePictureUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      if (!user) {
        throw new Error("You must be logged in to upload a profile picture.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log("Uploading file to path:", filePath);
      console.log("User ID:", user.id);
      console.log("File name:", fileName);
      console.log("File extension:", fileExt);

      // Check if the avatars bucket exists
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketsError) {
        console.error("Error listing buckets:", bucketsError);
        throw new Error("Could not verify storage setup: " + bucketsError.message);
      }
      
      console.log("Available buckets:", buckets.map(b => b.name));
      
      if (!buckets.some(b => b.name === 'avatars')) {
        console.error("Avatars bucket does not exist!");
        throw new Error("Storage is not properly configured. Please contact support.");
      }

      // Upload the file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error("Upload failed: " + uploadError.message);
      }

      console.log("Upload successful, data:", uploadData);
      console.log("Getting public URL");

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log("Public URL obtained:", publicUrl);

      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw new Error("Could not update profile: " + updateError.message);
      }

      console.log("Profile updated successfully");
      setAvatarUrl(publicUrl);
      onAvatarUpdate(publicUrl);
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: error?.message || "An error occurred while uploading your profile picture.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24 cursor-pointer relative group">
        <AvatarImage src={avatarUrl || ""} alt={userName || "Profile"} />
        <AvatarFallback className="text-2xl">
          {userName?.charAt(0) || "?"}
        </AvatarFallback>
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
          <Camera className="h-6 w-6 text-white" />
        </div>
      </Avatar>

      <div className="flex flex-col items-center gap-2">
        <Label 
          htmlFor="avatar-upload" 
          className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {avatarUrl ? "Change Picture" : "Upload Picture"}
            </>
          )}
        </Label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="hidden"
        />
      </div>
    </div>
  );
}
