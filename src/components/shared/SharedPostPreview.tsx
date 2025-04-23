
import React from 'react';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ExternalLink } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { AccountVerificationBadge } from "@/components/verification/AccountVerificationBadge";

interface SharedPostPreviewProps {
  postId: string;
  content: string;
  imageUrl?: string | null;
  author?: {
    id: string;
    name: string;
    avatar: string;
    verified?: boolean;
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
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium">{author.name}</span>
            {author.verified && (
              <AccountVerificationBadge 
                verified={author.verified} 
                userId={author.id}
                size="sm" 
              />
            )}
          </div>
        </div>
      )}
      
      {/* Post content */}
      <div className="flex flex-col">
        {/* Image if available */}
        {imageUrl && (
          <div className={`bg-muted relative ${compact ? 'max-h-32' : ''}`}>
            <img 
              src={imageUrl} 
              alt="Post image" 
              className="w-full h-auto object-contain"
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
