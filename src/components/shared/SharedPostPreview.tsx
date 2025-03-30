
import React from 'react';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ExternalLink } from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface SharedPostPreviewProps {
  postId: string;
  content: string;
  imageUrl?: string | null;
  author?: {
    name: string;
    avatar: string;
  };
  compact?: boolean;
}

export const SharedPostPreview = ({ 
  postId, 
  content, 
  imageUrl, 
  author,
  compact = false
}: SharedPostPreviewProps) => {
  const navigate = useNavigate();
  
  const handlePostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/post/${postId}`);
  };
  
  return (
    <Card 
      className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${compact ? 'mt-1' : 'mt-2'}`}
      onClick={handlePostClick}
    >
      {/* Author header */}
      {author && (
        <div className="p-2 bg-secondary/30 border-b flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {author.avatar || author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">{author.name}</span>
        </div>
      )}
      
      {/* Post content */}
      <div className="flex flex-col">
        {/* Image if available */}
        {imageUrl && (
          <div className={`${compact ? 'h-24' : 'h-32'} bg-muted relative`}>
            <img 
              src={imageUrl} 
              alt="Post image" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Text content */}
        <div className={`p-2 ${compact ? 'text-xs' : 'text-sm'}`}>
          <p className={`line-clamp-${compact ? '1' : '2'} text-foreground/90`}>
            {content}
          </p>
          
          <div className="mt-1 flex items-center text-xs text-muted-foreground">
            <ExternalLink className="h-3 w-3 mr-1" />
            <span>View post</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
