
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Check if this is a legacy startup route that should be redirected to business
  const isLegacyStartupRoute = location.pathname.startsWith('/startup');
  const correctedPath = isLegacyStartupRoute 
    ? location.pathname.replace('/startup', '/business')
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-6">
            The page you're looking for doesn't exist
          </p>
          
          {isLegacyStartupRoute && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-2">
                It looks like you're trying to access a startup route. 
                We've updated our URLs to use /business instead of /startup.
              </p>
              <Button asChild>
                <Link to={correctedPath}>
                  Go to {correctedPath}
                </Link>
              </Button>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link to="/">
                Return to Home
              </Link>
            </Button>
            
            {user && user.user_metadata?.user_type === 'startup' && (
              <Button asChild>
                <Link to="/business">
                  Go to Dashboard
                </Link>
              </Button>
            )}
            
            {user && user.user_metadata?.user_type === 'investor' && (
              <Button asChild>
                <Link to="/investor">
                  Go to Dashboard
                </Link>
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
