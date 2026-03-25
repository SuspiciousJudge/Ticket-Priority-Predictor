import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { authAPI, setAuthToken, getStoredToken } from '../../services/api';
import LoadingSkeleton from '../common/LoadingSkeleton';

export default function ProtectedRoute({ children, roles = [] }) {
  const location = useLocation();
  const token = getStoredToken();

  // Set token on the api instance immediately if available
  if (token) {
    setAuthToken(token);
  }

  const { data: userResponse, isLoading, isError, error } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authAPI.getMe();
      return res.data.data;
    },
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  // Only redirect to login on explicit auth errors (401 / 403).
  // Network errors or 5xx should not log the user out.
  if (isError) {
    const status = error?.status;
    if (status === 401 || status === 403) {
      setAuthToken(null);
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    // Non-auth error: still render the app with cached user data if available
  }

  if (!userResponse) {
    setAuthToken(null);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles.length > 0 && !roles.includes(userResponse.role)) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
}
