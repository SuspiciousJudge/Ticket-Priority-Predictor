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

  const { data: userResponse, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authAPI.getMe();
      return res.data.data;
    },
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000, // cache for 5 min to avoid repeated calls
  });

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (isError || !userResponse) {
    // Only clear token and redirect if the error is actually 401 (unauthorized)
    // For other errors (network, 500, etc.), show error message instead of redirect loop
    setAuthToken(null);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles.length > 0 && !roles.includes(userResponse.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}
