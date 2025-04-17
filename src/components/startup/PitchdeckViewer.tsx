
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, ExternalLink, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase-client-helper";

interface PitchdeckViewerProps {
  filePath: string;
  fileName: string;
  fileUrl?: string;
  onClose?: () => void;
}

export const PitchdeckViewer: React.FC<PitchdeckViewerProps> = ({
  filePath,
  fileName,
  fileUrl,
  onClose
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerType, setViewerType] = useState<'pdf' | 'pptx' | 'external'>('pdf');

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        
        if (fileUrl) {
          // Using external URL
          setViewerUrl(fileUrl);
          setViewerType('external');
          setLoading(false);
          return;
        }

        if (!filePath) {
          setError("No file path provided");
          setLoading(false);
          return;
        }

        console.log("Loading pitchdeck from path:", filePath);
        const fileExt = filePath.split('.').pop()?.toLowerCase();
        
        // Get the public URL from Supabase storage using the helper
        const client = getSupabaseClient();
        
        try {
          const { data } = client.storage.from('pitchdecks').getPublicUrl(filePath);
          
          if (!data || !data.publicUrl) {
            throw new Error("Failed to get public URL for file");
          }
          
          const publicUrl = data.publicUrl;
          console.log("Public URL:", publicUrl);

          if (fileExt === 'pdf') {
            setViewerType('pdf');
            // For PDF files, use direct embed with page parameter
            setViewerUrl(`${publicUrl}#page=${currentPage}`);
          } else if (fileExt === 'pptx' || fileExt === 'ppt') {
            setViewerType('pptx');
            // For PowerPoint files, use the Microsoft Office Online Viewer
            const encodedUrl = encodeURIComponent(publicUrl);
            setViewerUrl(`https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`);
          } else {
            setError(`Unsupported file type: ${fileExt}`);
          }
        } catch (err) {
          console.error("Error getting public URL:", err);
          setError("Failed to get file URL");
        }
      } catch (err) {
        console.error("Error loading document:", err);
        setError(err instanceof Error ? err.message : "Failed to load document");
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [filePath, fileUrl, currentPage]);

  // Handle next/previous page navigation (only works for PDFs)
  const nextPage = () => {
    if (viewerType === 'pdf' && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (viewerType === 'pdf' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Handle zoom controls
  const zoomIn = () => setZoom(Math.min(zoom + 25, 200));
  const zoomOut = () => setZoom(Math.max(zoom - 25, 50));

  // Handle document load events (for PDF to get page count)
  const handleDocumentLoad = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    try {
      // Try to access the iframe's content to get page count for PDFs
      const iframe = event.target as HTMLIFrameElement;
      if (iframe.contentWindow && viewerType === 'pdf') {
        // This might not work due to cross-origin restrictions
        // Would need a PDF.js implementation for better control
        setTotalPages(1); // Fallback if we can't detect
      }
      setLoading(false);
    } catch (error) {
      console.error("Error accessing iframe content:", error);
      setLoading(false);
    }
  };

  // Handle direct download
  const handleDownload = () => {
    if (viewerUrl) {
      const a = document.createElement('a');
      a.href = viewerUrl;
      a.download = fileName || 'pitchdeck';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Handle opening in new tab
  const handleOpenExternal = () => {
    if (viewerUrl) {
      window.open(viewerUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <p className="text-destructive">Error: {error}</p>
        <Button variant="outline" onClick={onClose} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls toolbar */}
      <div className="flex items-center justify-between bg-muted py-2 px-4 border-b">
        <div className="flex items-center space-x-2">
          {viewerType === 'pdf' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={prevPage} 
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} {totalPages > 0 ? `of ${totalPages}` : ''}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={nextPage} 
                disabled={totalPages > 0 && currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {viewerType === 'pdf' && (
            <>
              <Button variant="outline" size="sm" onClick={zoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm">{zoom}%</span>
              <Button variant="outline" size="sm" onClick={zoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenExternal}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Document viewer */}
      <div className="flex-1 overflow-hidden">
        {viewerUrl && (
          <iframe
            src={viewerUrl}
            className="w-full h-full border-none"
            style={{ 
              transform: viewerType === 'pdf' ? `scale(${zoom / 100})` : 'none',
              transformOrigin: 'center top',
              height: viewerType === 'pdf' && zoom !== 100 ? `${zoom}%` : '100%'
            }}
            onLoad={handleDocumentLoad}
            title="Pitch Deck Viewer"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
};
