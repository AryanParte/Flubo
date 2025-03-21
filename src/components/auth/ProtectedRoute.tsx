
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

type ProtectedRouteProps = {
  userType?: 'startup' | 'investor';
};

export const ProtectedRoute = ({ userType }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state if still checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check user type if specified
  if (userType && user.user_type !== userType) {
    // Redirect to the correct dashboard
    return <Navigate to={`/${user.user_type}`} replace />;
  }

  // User is authenticated and has the correct type
  return <Outlet />;
};
